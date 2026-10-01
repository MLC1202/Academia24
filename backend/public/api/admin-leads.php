<?php
declare(strict_types=1);

// GET /api/admin-leads.php?unidade=norte&status=novo&pagina=1   (so admin)
// Todos os filtros sao opcionais. 50 por pagina, mais novos primeiro.
//
//   200 { leads: [...], total, pagina, por_pagina, contagem: {novo: 3, ...} }
//   400 { erro: "dados_invalidos" }
//
// Tem dado pessoal: nunca vai pro cache (Cache-Control: no-store, padrao da
// API) e cada consulta fica no log (quem viu, sem os dados em si).

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/grade.php';
require __DIR__ . '/../../src/leads.php';

exigir_metodo('GET');
iniciar_sessao();
$adminId = exigir_admin();

$unidade = $_GET['unidade'] ?? '';
$status = $_GET['status'] ?? '';
$pagina = $_GET['pagina'] ?? '1';

if (
    !is_string($unidade) || ($unidade !== '' && !unidade_existe(db(), $unidade))
    || !is_string($status) || ($status !== '' && !in_array($status, LEAD_STATUS, true))
    || !is_string($pagina) || preg_match('/^[1-9][0-9]{0,5}$/', $pagina) !== 1
) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Filtro inválido.']);
}

[$leads, $total, $contagem] = listar_leads(
    db(),
    $unidade === '' ? null : $unidade,
    $status === '' ? null : $status,
    (int) $pagina,
);

registrar('info', 'leads_consultados', [
    'admin_id' => $adminId,
    'unidade' => $unidade,
    'status' => $status,
    'pagina' => (int) $pagina,
]);

responder(200, [
    'leads' => $leads,
    'total' => $total,
    'pagina' => (int) $pagina,
    'por_pagina' => LEAD_POR_PAGINA,
    'contagem' => $contagem,
]);
