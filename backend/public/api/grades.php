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
// servidor e apagado na hora -- ver gravar/apagar_cancelamentos() em
// src/cancelamentos.php e admin-atualizar-grade.php (botao "Atualizar agora").
//
// Antes era "max-age=60": o navegador nem perguntava por 60 s, entao
// cancelar/desfazer aula demorava ate 1 min pra aparecer pra quem ja tinha
// aberto o site (achado pelo Matheus em 01/10/2026).

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/grade.php'; // ja traz o cache.php
require __DIR__ . '/../../src/pacto.php';

exigir_metodo('GET', 'HEAD');

// As aulas vem do Pacto (src/pacto.php); a dona muda la e o site acompanha
// em ate CACHE_SEGUNDOS. Cancelar uma aula limpa o cache na hora.
const CACHE_SEGUNDOS = 600;

$json = cache_ler('grades', CACHE_SEGUNDOS);
if ($json === null) {
    // Anotada ANTES de ler o banco (ver cache_gravar em src/cache.php).
    $geracao = cache_geracao('grades');
    try {
        $json = json_grades_publicas(db());
        cache_gravar('grades', $json, $geracao);
    } catch (RuntimeException | JsonException $e) {
        // Pacto fora do ar ou formato mudou: segue com a ultima copia boa
        // (qualquer idade) e so tenta de novo daqui a CACHE_SEGUNDOS, pra
        // nao fazer todo visitante esperar o timeout.
        registrar('erro', 'pacto_falhou', ['msg' => $e->getMessage()]);
        $json = cache_ler('grades', PHP_INT_MAX);
        if ($json === null) {
            responder(503, ['erro' => 'grade_indisponivel']);
        }
        touch(pasta_cache() . '/grades.json');
    }
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
