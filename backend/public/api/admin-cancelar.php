<?php
declare(strict_types=1);

// POST /api/admin-cancelar.php   (admin + CSRF)
//   { unidade, data, hora, modalidade }    cancela UMA aula naquela data
//   { unidade, data, dia_inteiro: true }   cancela TODAS as aulas do dia
//
//   200 { ok: true, cancelados: 3 }   -- quantos eram novos
//   400 { erro: "dados_invalidos" | "fora_do_prazo" }
//   404 { erro: "aula_nao_encontrada" }  -- nao existe na grade publicada
//   404 { erro: "dia_sem_aulas" }

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/cancelamentos.php';

exigir_metodo('POST');
iniciar_sessao();
$adminId = exigir_admin();
exigir_csrf();

[$unidade, $data, $hora, $modalidade] = ler_pedido_cancelamento(db(), ler_json(2_000));

if (!data_cancelavel($data)) {
    responder(400, [
        'erro' => 'fora_do_prazo',
        'detalhe' => 'Dá para cancelar de hoje até ' . CANCEL_DIAS_FRENTE . ' dias à frente.',
    ]);
}

// So aulas que existem na grade publicada daquele dia da semana.
$doDia = aulas_da_data(db(), $unidade, $data);
if ($hora === null) {
    if (!$doDia) {
        responder(404, ['erro' => 'dia_sem_aulas', 'detalhe' => 'Não há aulas nesse dia.']);
    }
    $alvo = $doDia;
} else {
    $alvo = array_values(array_filter(
        $doDia,
        fn($a) => $a['hora'] === $hora && $a['modalidade'] === $modalidade,
    ));
    if (!$alvo) {
        responder(404, [
            'erro' => 'aula_nao_encontrada',
            'detalhe' => 'Essa aula não está na grade publicada desse dia.',
        ]);
    }
}

$novos = gravar_cancelamentos(db(), $unidade, $data, $alvo, $adminId);

registrar('aviso', $hora === null ? 'dia_cancelado' : 'aula_cancelada', [
    'admin_id' => $adminId,
    'unidade' => $unidade,
    'data' => $data->format('Y-m-d'),
    'hora' => $hora,
    'modalidade' => $modalidade,
    'novos' => $novos,
]);
responder(200, ['ok' => true, 'cancelados' => $novos]);
