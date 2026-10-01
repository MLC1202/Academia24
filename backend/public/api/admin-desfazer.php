<?php
declare(strict_types=1);

// POST /api/admin-desfazer.php   { "unidade": "alphaville" }   (admin + CSRF)
// Volta a grade da unidade pra versao anterior a que esta no ar.
// Nada e apagado (a que saiu fica no historico); chamar de novo volta mais.
//
//   200 { ok: true, versao: 12 }
//   400 { erro: "sem_versao_anterior" }

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/grade.php';

exigir_metodo('POST');
iniciar_sessao();
$adminId = exigir_admin();
exigir_csrf();

$dados = ler_json();
$unidade = $dados['unidade'] ?? null;
if (!is_string($unidade) || !unidade_existe(db(), $unidade)) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Unidade inválida.']);
}

$versao = voltar_versao_anterior(db(), $unidade);
if ($versao === null) {
    responder(400, ['erro' => 'sem_versao_anterior', 'detalhe' => 'Não há versão anterior para voltar.']);
}

registrar('aviso', 'grade_desfeita', ['admin_id' => $adminId, 'unidade' => $unidade, 'versao' => $versao]);
responder(200, ['ok' => true, 'versao' => $versao]);
