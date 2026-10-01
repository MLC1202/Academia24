<?php
declare(strict_types=1);

// POST /api/login.php   { "email": "...", "senha": "...", "lembrar": true|false }
// Header obrigatorio: X-CSRF-Token (vem do GET /api/sessao.php)
//
// Respostas:
//   200 { mfa: true }                       -- senha certa, agora o codigo
//                                              (POST /api/login-mfa.php)
//   200 { ok: true }                        -- senha certa + aparelho
//                                              confiavel (pulou o codigo)
//   200 { ok: true }                        -- so em dev, conta sem MFA
//   401 { erro: "credenciais_invalidas" }   -- mesma msg pra e-mail ou senha
//   403 { erro: "mfa_obrigatorio" }         -- producao, conta sem MFA
//   429 { erro: "muitas_tentativas" }       -- errou demais, espere

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/limite.php';
require __DIR__ . '/../../src/mfa.php';
require __DIR__ . '/../../src/aparelho.php';

exigir_metodo('POST');
iniciar_sessao();
exigir_csrf();

// Limites: por IP (alguem testando varios e-mails) e por e-mail (alguem
// tentando adivinhar a senha da dona de varios lugares).
const JANELA_SEG = 15 * 60;
const MAX_POR_IP = 20;
const MAX_POR_EMAIL = 5;

$dados = ler_json();
$email = is_string($dados['email'] ?? null) ? mb_strtolower(trim($dados['email'])) : '';
$senha = is_string($dados['senha'] ?? null) ? $dados['senha'] : '';

// Formato absurdo nem chega a consultar o banco (mas conta como tentativa).
$formatoOk = $email !== '' && mb_strlen($email) <= 190 && $senha !== '' && strlen($senha) <= 1024;

$ip = ip_cliente();
if (
    tentativas_recentes('login_ip', $ip, JANELA_SEG) >= MAX_POR_IP
    || ($formatoOk && tentativas_recentes('login_email', $email, JANELA_SEG) >= MAX_POR_EMAIL)
) {
    registrar('aviso', 'login_bloqueado', []);
    bloquear_com_429(JANELA_SEG);
}

$admin = false;
if ($formatoOk) {
    $st = db()->prepare('SELECT id, senha_hash, mfa_segredo FROM admins WHERE email = ? AND ativo = 1');
    $st->execute([$email]);
    $admin = $st->fetch();
}

// Mesmo quando o e-mail nao existe, rodo um password_verify "de mentira".
// Sem isso, a resposta viria mais rapido e daria pra descobrir quais
// e-mails tem conta so cronometrando. (Hash de uma senha aleatoria
// descartada: nenhuma senha bate com ele.)
const HASH_FALSO = '$argon2id$v=19$m=65536,t=4,p=1$WURjS1RnTllyT0wuZzZ5Vw$yJtlzpchM3rG925XO+wjFStcMMGj1xwWREs4f/svSOk';
$senhaOk = password_verify($senha, $admin ? $admin['senha_hash'] : HASH_FALSO) && $admin;

if (!$senhaOk) {
    registrar_tentativa('login_ip', $ip);
    if ($formatoOk) {
        registrar_tentativa('login_email', $email);
    }
    registrar('aviso', 'login_falhou', []);
    responder(401, ['erro' => 'credenciais_invalidas']);
}

$id = (int) $admin['id'];

// Se o algoritmo/custo recomendado mudou, atualiza o hash agora que temos
// a senha em maos.
$algoritmo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
if (password_needs_rehash($admin['senha_hash'], $algoritmo)) {
    db()->prepare('UPDATE admins SET senha_hash = ? WHERE id = ?')
        ->execute([password_hash($senha, $algoritmo), $id]);
}

zerar_tentativas('login_email', $email);

// Senha certa e so METADE do login. Com MFA ligado, a sessao fica
// "esperando o codigo" por 5 min -- ainda nao e admin.
if ($admin['mfa_segredo'] !== null) {
    // Aparelho confiavel desta conta ("mantenha-me conectado", 30 dias):
    // a senha ja foi conferida acima, entao pula so o codigo.
    if (aparelho_confere(db(), $id)) {
        db()->prepare('UPDATE admins SET ultimo_login_em = UTC_TIMESTAMP() WHERE id = ?')->execute([$id]);
        entrar_como($id);
        registrar('info', 'login_ok', ['admin_id' => $id, 'mfa' => 'aparelho_confiavel']);
        responder(200, ['ok' => true, 'csrf' => csrf_token()]);
    }

    session_regenerate_id(true);
    $_SESSION = [
        // "lembrar" so vale depois que o codigo for aceito (login-mfa.php).
        'mfa_pendente' => [
            'admin_id' => $id,
            'ate' => time() + MFA_PRAZO_SEG,
            'lembrar' => ($dados['lembrar'] ?? false) === true,
        ],
        'csrf' => bin2hex(random_bytes(32)),
    ];
    registrar('info', 'login_senha_ok_aguardando_mfa', ['admin_id' => $id]);
    responder(200, ['mfa' => true, 'csrf' => csrf_token()]);
}

// Sem MFA: em producao nao entra (MFA e obrigatorio). Em dev entra, pra
// facilitar os testes.
if (em_producao()) {
    registrar('aviso', 'login_sem_mfa_recusado', ['admin_id' => $id]);
    responder(403, ['erro' => 'mfa_obrigatorio']);
}

db()->prepare('UPDATE admins SET ultimo_login_em = UTC_TIMESTAMP() WHERE id = ?')->execute([$id]);
entrar_como($id);
registrar('info', 'login_ok', ['admin_id' => $id, 'mfa' => false]);

responder(200, ['ok' => true, 'csrf' => csrf_token()]);
