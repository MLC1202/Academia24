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

// Aviso (nao derruba nada): em producao o .env tem que ser 600 (ou 640).
// Se "todo mundo" pode ler, anota no log -- no maximo 1 vez por dia, pra
// nao encher o log a cada visita.
function avisar_env_aberto(): void
{
    if (PHP_SAPI === 'cli' || !em_producao()) {
        return;
    }
    $permissao = @fileperms(dirname(__DIR__) . '/.env');
    if ($permissao === false || ($permissao & 0004) === 0) {
        return; // "outros" nao leem: ok
    }
    $marca = pasta_logs() . '/.aviso-env-aberto';
    if (is_file($marca) && filemtime($marca) > time() - 86400) {
        return; // ja avisou nas ultimas 24 h
    }
    touch($marca);
    registrar('aviso', 'env_legivel_por_todos', [
        'permissao' => substr(sprintf('%o', $permissao), -3),
        'corrigir' => 'Gerenciador de Arquivos > .env > Permissoes = 600',
    ]);
}

exigir_dev_so_local();
avisar_env_aberto();
headers_seguranca();
