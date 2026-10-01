<?php
declare(strict_types=1);

// GET /api/admin-leads-resumo.php?unidade=norte   (so admin; unidade opcional)
// Numeros por mes, SEM nenhum dado pessoal: recebidos e em que status estao.
//
//   200 { meses: [{ mes: "2026-10", recebidos, novos, contatados,
//                   matricularam, descartados }, ...], retencao_meses: 6 }

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/grade.php';
require __DIR__ . '/../../src/leads.php';

exigir_metodo('GET');
iniciar_sessao();
exigir_admin();

$unidade = $_GET['unidade'] ?? '';
if (!is_string($unidade) || ($unidade !== '' && !unidade_existe(db(), $unidade))) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Unidade inválida.']);
}

responder(200, [
    'meses' => resumo_leads(db(), $unidade === '' ? null : $unidade),
    'retencao_meses' => LEAD_RETENCAO_MESES,
]);
