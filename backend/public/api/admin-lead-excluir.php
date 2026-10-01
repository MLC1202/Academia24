<?php
declare(strict_types=1);

// POST /api/admin-lead-excluir.php   { "id": 12 }   (admin + CSRF)
// Exclusao DE VERDADE (LGPD: pedido do titular ou lead que nao interessa).
// Nao tem "lixeira": a linha some do banco. O log guarda so o numero.
//
//   200 { ok: true }
//   404 { erro: "nao_encontrado" }

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/leads.php';

exigir_metodo('POST');
iniciar_sessao();
$adminId = exigir_admin();
exigir_csrf();

$j = ler_json(1_000);
$id = id_valido($j['id'] ?? null);
if ($id === null) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Lead inválido.']);
}

$st = db()->prepare('DELETE FROM leads WHERE id = ?');
$st->execute([$id]);
if ($st->rowCount() === 0) {
    responder(404, ['erro' => 'nao_encontrado', 'detalhe' => 'Esse lead já tinha sido excluído.']);
}

registrar('aviso', 'lead_excluido', ['admin_id' => $adminId, 'id' => $id]);
responder(200, ['ok' => true]);
