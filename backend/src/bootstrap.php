<?php
declare(strict_types=1);

// Primeira linha de todo endpoint:
//   require __DIR__ . '/../../src/bootstrap.php';

require __DIR__ . '/config.php';
require __DIR__ . '/db.php';
require __DIR__ . '/resposta.php';
require __DIR__ . '/log.php';

// Erro nunca aparece pro visitante: vai pro log, e ele recebe so um codigo.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', pasta_logs() . '/php-erros.log');

set_exception_handler(function (Throwable $e): void {
    registrar('erro', 'excecao_nao_tratada', [
        'tipo' => get_class($e),
        'msg' => $e->getMessage(),
        'onde' => basename($e->getFile()) . ':' . $e->getLine(),
    ]);
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo '{"erro":"erro_interno"}';
});

headers_seguranca();
