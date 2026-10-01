<?php
declare(strict_types=1);

// GET /api/sessao.php
// Diz se tem alguem logado e entrega o token CSRF que o front precisa
// mandar em todo POST. Nunca vai pro cache (Cache-Control: no-store).

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';

exigir_metodo('GET');
iniciar_sessao();

$id = admin_logado_id();
$email = null;
if ($id !== null) {
    $st = db()->prepare('SELECT email FROM admins WHERE id = ? AND ativo = 1');
    $st->execute([$id]);
    $email = $st->fetchColumn() ?: null;
    if ($email === null) {
        encerrar_sessao();
        iniciar_sessao();
    }
}

// Senha ja foi aceita e falta o codigo (e o prazo nao venceu)?
$pendente = $_SESSION['mfa_pendente'] ?? null;
$aguardandoMfa = $email === null && is_array($pendente) && $pendente['ate'] >= time();

responder(200, [
    'logado' => $email !== null,
    'aguardando_mfa' => $aguardandoMfa,
    'email' => $email,
    'csrf' => csrf_token(),
]);
