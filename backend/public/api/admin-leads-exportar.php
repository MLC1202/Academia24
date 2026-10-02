<?php
declare(strict_types=1);

// GET /api/admin-leads-exportar.php?unidade=norte&status=novo   (so admin)
// TODOS os leads do filtro (sem paginar), pro botao "Exportar Excel" do
// dashboard. Filtros opcionais. O .xlsx e montado no navegador
// (frontend/src/lib/planilha/xlsx-escrever.ts).
//
//   200 { leads: [...], total, limite }
//   400 { erro: "dados_invalidos" }
//   429 { erro: "muitas_tentativas" }
//
// Dado pessoal saindo do sistema: toda exportacao vai pro log (quem, filtro,
// quantos) -- nunca nome, e-mail ou telefone.

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/limite.php';
require __DIR__ . '/../../src/grade.php';
require __DIR__ . '/../../src/leads.php';

exigir_metodo('GET');
iniciar_sessao();
$adminId = exigir_admin();

// 10 exportacoes a cada 15 min: sobra pro uso normal, freia script/abuso.
const JANELA_SEG = 15 * 60;
const MAX_EXPORTAR = 10;
$chave = 'admin:' . $adminId;
if (tentativas_recentes('exportar_leads', $chave, JANELA_SEG) >= MAX_EXPORTAR) {
    registrar('aviso', 'exportacao_bloqueada', ['admin_id' => $adminId]);
    bloquear_com_429(JANELA_SEG);
}

$unidade = $_GET['unidade'] ?? '';
$status = $_GET['status'] ?? '';
if (
    !is_string($unidade) || ($unidade !== '' && !unidade_existe(db(), $unidade))
    || !is_string($status) || ($status !== '' && !in_array($status, LEAD_STATUS, true))
) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Filtro inválido.']);
}

registrar_tentativa('exportar_leads', $chave);
$leads = exportar_leads(db(), $unidade === '' ? null : $unidade, $status === '' ? null : $status);

registrar('aviso', 'leads_exportados', [
    'admin_id' => $adminId,
    'unidade' => $unidade,
    'status' => $status,
    'quantidade' => count($leads),
]);

responder(200, [
    'leads' => $leads,
    'total' => count($leads),
    'limite' => LEAD_EXPORTAR_MAX,
]);
