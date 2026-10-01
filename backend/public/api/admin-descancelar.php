<?php
declare(strict_types=1);

// POST /api/admin-descancelar.php   (admin + CSRF)  -- desfaz cancelamento
//   { unidade, data, hora, modalidade }    volta UMA aula
//   { unidade, data, dia_inteiro: true }   volta o dia inteiro
// A aula volta a aparecer normal no site na hora.
//
//   200 { ok: true, desfeitos: 1 }
//   400 { erro: "dados_invalidos" | "data_passada" }

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/cancelamentos.php';

exigir_metodo('POST');
iniciar_sessao();
$adminId = exigir_admin();
exigir_csrf();

[$unidade, $data, $hora, $modalidade] = ler_pedido_cancelamento(db(), ler_json(2_000));

// Passado fica como esta (historico). Futuro pode, mesmo depois dos 60 dias.
if ($data < hoje_no_site()) {
    responder(400, ['erro' => 'data_passada', 'detalhe' => 'Essa data já passou.']);
}

$desfeitos = apagar_cancelamentos(db(), $unidade, $data, $hora, $modalidade);

registrar('aviso', $hora === null ? 'dia_descancelado' : 'aula_descancelada', [
    'admin_id' => $adminId,
    'unidade' => $unidade,
    'data' => $data->format('Y-m-d'),
    'hora' => $hora,
    'modalidade' => $modalidade,
    'desfeitos' => $desfeitos,
]);
responder(200, ['ok' => true, 'desfeitos' => $desfeitos]);
