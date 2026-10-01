<?php
declare(strict_types=1);

// POST /api/login-mfa.php   { "codigo": "123456" }   (header X-CSRF-Token)
// Segunda metade do login: so funciona depois que /api/login.php aceitou a
// senha (e por ate 5 min).
//
//   200 { ok: true }
//   401 { erro: "codigo_invalido" }
//   401 { erro: "sem_login_pendente" }   -- senha nao foi feita ou prazo venceu
//   429 { erro: "muitas_tentativas" }

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/limite.php';
require __DIR__ . '/../../src/mfa.php';
require __DIR__ . '/../../src/aparelho.php';

exigir_metodo('POST');
iniciar_sessao();
exigir_csrf();

const JANELA_SEG = 15 * 60;
const MAX_POR_CONTA = 5; // 5 chutes de 6 digitos: chance de acerto ~0,0005%

$pendente = $_SESSION['mfa_pendente'] ?? null;
if (!is_array($pendente) || $pendente['ate'] < time()) {
    unset($_SESSION['mfa_pendente']);
    responder(401, ['erro' => 'sem_login_pendente']);
}
$id = (int) $pendente['admin_id'];
$chaveLimite = 'admin:' . $id;

if (tentativas_recentes('login_mfa', $chaveLimite, JANELA_SEG) >= MAX_POR_CONTA) {
    // Errou demais: joga fora a etapa da senha tambem (recomeca do zero).
    unset($_SESSION['mfa_pendente']);
    registrar('aviso', 'mfa_bloqueado', ['admin_id' => $id]);
    bloquear_com_429(JANELA_SEG);
}

$dados = ler_json();
$codigo = is_string($dados['codigo'] ?? null) ? preg_replace('/\s+/', '', $dados['codigo']) : '';

$st = db()->prepare('SELECT mfa_segredo, mfa_ultimo_passo FROM admins WHERE id = ? AND ativo = 1');
$st->execute([$id]);
$admin = $st->fetch();
if (!$admin || $admin['mfa_segredo'] === null) {
    unset($_SESSION['mfa_pendente']);
    responder(401, ['erro' => 'sem_login_pendente']);
}

$ultimo = $admin['mfa_ultimo_passo'] === null ? null : (int) $admin['mfa_ultimo_passo'];
$passo = totp_verificar(mfa_decifrar($admin['mfa_segredo']), $codigo, $ultimo);

if ($passo === null) {
    registrar_tentativa('login_mfa', $chaveLimite);
    registrar('aviso', 'mfa_falhou', ['admin_id' => $id]);
    responder(401, ['erro' => 'codigo_invalido']);
}

// Marca o passo como usado: o mesmo codigo nao entra de novo.
db()->prepare('UPDATE admins SET mfa_ultimo_passo = ?, ultimo_login_em = UTC_TIMESTAMP() WHERE id = ?')
    ->execute([$passo, $id]);
zerar_tentativas('login_mfa', $chaveLimite);
$lembrar = ($pendente['lembrar'] ?? false) === true; // antes do entrar_como apagar
entrar_como($id); // troca o ID da sessao e apaga o "pendente"
registrar('info', 'login_ok', ['admin_id' => $id, 'mfa' => true]);

// Marcou "mantenha-me conectado": este navegador vira aparelho confiavel.
if ($lembrar) {
    aparelho_lembrar(db(), $id);
}

responder(200, ['ok' => true, 'csrf' => csrf_token()]);
