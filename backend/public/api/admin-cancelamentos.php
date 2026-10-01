<?php
declare(strict_types=1);

// GET /api/admin-cancelamentos.php?unidade=norte&data=2026-10-12   (so admin)
// data e opcional.
//
//   200 { hoje, max,                      -- limites do calendario (cancelar)
//         dia: "seg" | null,
//         aulas: [{hora, modalidade, cancelada}] | null,   -- so com data
//         proximos: [{data, hora, modalidade}] }           -- de hoje em diante

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/cancelamentos.php';

exigir_metodo('GET');
iniciar_sessao();
exigir_admin();

$unidade = $_GET['unidade'] ?? null;
if (!is_string($unidade) || !unidade_existe(db(), $unidade)) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Unidade inválida.']);
}

$data = null;
if (isset($_GET['data'])) {
    $data = ler_data($_GET['data']);
    if ($data === null) {
        responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Data inválida.']);
    }
}

$hoje = hoje_no_site();
responder(200, [
    'hoje' => $hoje->format('Y-m-d'),
    'max' => $hoje->modify('+' . CANCEL_DIAS_FRENTE . ' days')->format('Y-m-d'),
    'dia' => $data ? dia_da_semana($data) : null,
    'aulas' => $data ? aulas_da_data(db(), $unidade, $data) : null,
    'proximos' => proximos_cancelamentos(db(), $unidade),
]);
