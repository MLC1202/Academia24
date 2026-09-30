<?php
declare(strict_types=1);

// Log de eventos (login, upload, cancelamento, erro) em JSON, uma linha por
// evento, em backend/logs/ -- fora do public_html.
// NUNCA passar senha, token ou dado pessoal completo no $contexto.

function pasta_logs(): string
{
    $pasta = dirname(__DIR__) . '/logs';
    if (!is_dir($pasta)) {
        mkdir($pasta, 0750, true);
    }
    return $pasta;
}

function registrar(string $nivel, string $evento, array $contexto = []): void
{
    $linha = json_encode([
        'quando' => gmdate('c'),
        'nivel' => $nivel,
        'evento' => $evento,
        'rota' => $_SERVER['REQUEST_URI'] ?? 'cli',
        'ctx' => $contexto,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    // Um arquivo por mes, pra ficar facil apagar os antigos.
    file_put_contents(
        pasta_logs() . '/app-' . gmdate('Y-m') . '.log',
        $linha . PHP_EOL,
        FILE_APPEND | LOCK_EX,
    );
}
