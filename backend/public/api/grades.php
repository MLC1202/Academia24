<?php
declare(strict_types=1);

// GET /api/grades.php
// Publico. Devolve a grade no ar de cada unidade + cancelamentos dos
// proximos 7 dias (hoje incluido).
//
// Muita gente abre o site ao mesmo tempo, e a grade muda pouco. Entao:
//  1. Cache no servidor: o JSON pronto fica guardado CACHE_SEGUNDOS; nesse
//     tempo ninguem toca no banco.
//  2. Navegador: "no-cache" + ETag. O navegador GUARDA a copia, mas
//     pergunta toda vez "ainda e esta?". Se for, a resposta e um 304 vazio
//     (quase nada de dados); se nao for, vem a nova.
// Quando a grade mudar (upload/edicao/cancelamento), o arquivo de cache do
// servidor e apagado na hora -- ver salvar_nova_versao() em src/grade.php e
// gravar/apagar_cancelamentos() em src/cancelamentos.php.
//
// Antes era "max-age=60": o navegador nem perguntava por 60 s, entao
// cancelar/desfazer aula demorava ate 1 min pra aparecer pra quem ja tinha
// aberto o site (achado pelo Matheus em 01/10/2026).

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

// Conteudo publico, mas SEMPRE confere com o servidor antes de usar a copia.
header('Cache-Control: public, no-cache');
$hash = hash('sha256', $json);
$etag = '"' . $hash . '"';
header('ETag: ' . $etag);

// If-None-Match pode vir como lista ("a", "b") ou fraco (W/"a"), e alguns
// servidores acrescentam "-gzip" ao comprimir. Compara so o hash.
$pedido = (string) ($_SERVER['HTTP_IF_NONE_MATCH'] ?? '');
foreach (explode(',', $pedido) as $tag) {
    $tag = trim(preg_replace('/^W\//', '', trim($tag)), '"');
    if ($tag === $hash || $tag === $hash . '-gzip') {
        http_response_code(304);
        exit;
    }
}

http_response_code(200);
echo $json;
