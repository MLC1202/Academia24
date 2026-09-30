<?php
declare(strict_types=1);

// GET /api/grades.php
// Publico. Devolve a grade no ar de cada unidade + cancelamentos dos
// proximos 7 dias (hoje incluido).
//
// Muita gente abre o site ao mesmo tempo, e a grade muda pouco. Entao:
//  1. Cache no servidor: o JSON pronto fica guardado CACHE_SEGUNDOS; nesse
//     tempo ninguem toca no banco.
//  2. Cache no navegador (Cache-Control) + ETag: se o visitante ja tem a
//     versao atual, a resposta e um 304 vazio.
// Quando a grade mudar (upload/cancelamento), o arquivo de cache e apagado
// na hora -- ver salvar_nova_versao() em src/grade.php.

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/grade.php'; // ja traz o cache.php

exigir_metodo('GET', 'HEAD');

const CACHE_SEGUNDOS = 60;

$json = cache_ler('grades', CACHE_SEGUNDOS);
if ($json === null) {
    $json = json_encode(
        carregar_grades_publicas(db()),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
    );
    cache_gravar('grades', $json);
}

// Conteudo publico: pode ficar no navegador/CDN por um minuto.
header('Cache-Control: public, max-age=' . CACHE_SEGUNDOS);
$etag = '"' . hash('sha256', $json) . '"';
header('ETag: ' . $etag);

if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) {
    http_response_code(304);
    exit;
}

http_response_code(200);
echo $json;
