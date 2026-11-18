<?php
declare(strict_types=1);

// POST /api/admin-avaliacao.php   { "unidade": "norte", "nota": 4.6 }
// (admin + CSRF). Troca a nota do Google mostrada na LP da unidade.
//
//   200 { ok: true, nota: 4.6 }
//   400 { erro: "dados_invalidos" }

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/grade.php';
require __DIR__ . '/../../src/avaliacoes.php';

exigir_metodo('POST');
iniciar_sessao();
$adminId = exigir_admin();
exigir_csrf();

$j = ler_json(1_000);
$unidade = $j['unidade'] ?? null;
$nota = ler_nota($j['nota'] ?? null);
if (!is_string($unidade) || !unidade_existe(db(), $unidade)) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Unidade inválida.']);
}
if ($nota === null) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Nota inválida: use um valor de 1,0 a 5,0, com uma casa decimal.']);
}

$st = db()->prepare(
    'INSERT INTO avaliacoes_google (unidade, nota, atualizado_por) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE nota = VALUES(nota), atualizado_por = VALUES(atualizado_por)'
);
$st->execute([$unidade, $nota, $adminId]);

registrar('info', 'nota_google_atualizada', ['admin_id' => $adminId, 'unidade' => $unidade, 'nota' => $nota]);
responder(200, ['ok' => true, 'nota' => $nota]);
