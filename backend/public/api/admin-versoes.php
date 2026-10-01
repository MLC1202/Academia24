<?php
declare(strict_types=1);

// GET /api/admin-versoes.php?unidade=alphaville   (so admin logado)
// Historico das ultimas 10 versoes da grade da unidade (a "ativa" e a que
// esta no site). Nunca vai pro cache.

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/grade.php';

exigir_metodo('GET');
iniciar_sessao();
exigir_admin();

$unidade = $_GET['unidade'] ?? null;
if (!is_string($unidade) || !unidade_existe(db(), $unidade)) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Unidade inválida.']);
}

responder(200, ['versoes' => listar_versoes(db(), $unidade)]);
