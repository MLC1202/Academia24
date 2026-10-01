<?php
declare(strict_types=1);

// POST /api/admin-lead-status.php   { "id": 12, "status": "contatado" }
// (admin + CSRF). Guarda quem mudou e quando.
//
//   200 { ok: true }
//   400 { erro: "dados_invalidos" }
//   404 { erro: "nao_encontrado" }   -- ja foi excluido

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/leads.php';

exigir_metodo('POST');
iniciar_sessao();
$adminId = exigir_admin();
exigir_csrf();

$j = ler_json(1_000);
$id = id_valido($j['id'] ?? null);
$status = $j['status'] ?? null;
if ($id === null || !is_string($status) || !in_array($status, LEAD_STATUS, true)) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Status inválido.']);
}

$st = db()->prepare(
    'UPDATE leads SET status = ?, status_em = UTC_TIMESTAMP(), status_por = ? WHERE id = ?'
);
$st->execute([$status, $adminId, $id]);

// rowCount so conta linha que MUDOU. 0 pode ser "nao existe" ou "mesmo
// valor no mesmo segundo" (clique duplo): confiro se existe.
$existe = $st->rowCount() > 0;
if (!$existe) {
    $c = db()->prepare('SELECT 1 FROM leads WHERE id = ?');
    $c->execute([$id]);
    $existe = (bool) $c->fetchColumn();
}
if (!$existe) {
    responder(404, ['erro' => 'nao_encontrado', 'detalhe' => 'Esse lead não existe mais.']);
}

registrar('info', 'lead_status', ['admin_id' => $adminId, 'id' => $id, 'status' => $status]);
responder(200, ['ok' => true]);
