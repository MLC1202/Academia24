<?php
declare(strict_types=1);

// Tudo que sai da API passa por aqui: headers de seguranca e JSON.

function headers_seguranca(): void
{
    header_remove('X-Powered-By'); // nao anunciar versao do PHP
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    header('Referrer-Policy: no-referrer');
    // Padrao e nao guardar em cache. Endpoint publico que puder, sobrescreve.
    header('Cache-Control: no-store');

    if (em_producao()) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }

    // CORS: front e API no mesmo dominio, entao de proposito NAO existe
    // Access-Control-Allow-Origin aqui. Nunca colocar '*'.
}

function responder(int $status, array $dados): never
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function exigir_metodo(string ...$permitidos): void
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($metodo, $permitidos, true)) {
        header('Allow: ' . implode(', ', $permitidos));
        responder(405, ['erro' => 'metodo_nao_permitido']);
    }
}

// Le o corpo JSON de um POST. Exige Content-Type JSON (formulario HTML de
// outro site nao consegue mandar isso sem CORS) e limita o tamanho.
function ler_json(int $maxBytes = 10_000): array
{
    $tipo = $_SERVER['CONTENT_TYPE'] ?? '';
    if (!str_starts_with(strtolower($tipo), 'application/json')) {
        responder(415, ['erro' => 'use_json']);
    }
    $corpo = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if ($corpo === false || strlen($corpo) > $maxBytes) {
        responder(413, ['erro' => 'corpo_grande_demais']);
    }
    try {
        $dados = json_decode($corpo, true, 20, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        responder(400, ['erro' => 'json_invalido']);
    }
    if (!is_array($dados)) {
        responder(400, ['erro' => 'json_invalido']);
    }
    return $dados;
}
