<?php
declare(strict_types=1);

// GET /api/saude.php -> {"ok":true} se o PHP e o banco respondem.
// E a URL que o monitor de disponibilidade (ex.: UptimeRobot) vai chamar.
// Nao revela versao, erro nem nada interno.

require __DIR__ . '/../../src/bootstrap.php';

exigir_metodo('GET', 'HEAD');

try {
    db()->query('SELECT 1');
} catch (Throwable $e) {
    registrar('erro', 'saude_banco_fora', ['msg' => $e->getMessage()]);
    responder(503, ['ok' => false]);
}

responder(200, ['ok' => true]);
