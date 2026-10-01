<?php
declare(strict_types=1);

// POST /api/logout.php   (header X-CSRF-Token)
// Encerra a sessao no servidor e apaga o cookie.

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';

exigir_metodo('POST');
iniciar_sessao();
exigir_csrf();

$id = admin_logado_id();
encerrar_sessao();
if ($id !== null) {
    registrar('info', 'logout', ['admin_id' => $id]);
}
responder(200, ['ok' => true]);
