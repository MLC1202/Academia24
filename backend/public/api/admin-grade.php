<?php
declare(strict_types=1);

// POST /api/admin-grade.php   (so admin logado + header X-CSRF-Token)
// Salva a grade de UMA unidade e ja coloca no ar.
//
// Corpo: { "unidade": "alphaville",
//          "grade": { "seg": [ {"hora":"07:00","modalidade":"Yoga",
//                               "duracao":60, "professor":"Carol", "categoria":"Body Mind",
//                               "estudio":"Studio 2"} ], ... } }
// (duracao/professor/categoria/estudio sao opcionais; campo desconhecido e ignorado)
// "origem": "upload" (veio da planilha) ou "edicao" (padrao, editor manual).
// "versao_base": versao que o editor carregou (opcional). Se a do ar for
// outra (outra aba salvou/desfez no meio), nada e gravado e volta 409.
//
//   200 { ok: true, versao: 12 }
//   400 { erro: "dados_invalidos", detalhe: "Terça, aula 3: horário inválido" }
//   401 { erro: "nao_autenticado" }      -- sessao expirou: logar de novo
//   403 { erro: "csrf_invalido" }
//   409 { erro: "grade_mudou" }          -- recarregar e refazer a edicao
//   429 { erro: "muitas_tentativas" }
//
// A grade anterior continua guardada em grade_versoes (da pra voltar).

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/limite.php';
require __DIR__ . '/../../src/grade.php';

exigir_metodo('POST');
iniciar_sessao();
$adminId = exigir_admin();
exigir_csrf();

// Freio pra script/abuso: 60 salvamentos a cada 15 min e mais que suficiente.
const JANELA_SEG = 15 * 60;
const MAX_SALVAR = 60;
$chave = 'admin:' . $adminId;
if (tentativas_recentes('salvar_grade', $chave, JANELA_SEG) >= MAX_SALVAR) {
    bloquear_com_429(JANELA_SEG);
}
registrar_tentativa('salvar_grade', $chave);

// 500 aulas x ~100 bytes cabem folgado em 100 KB.
$dados = ler_json(100_000);

$unidade = $dados['unidade'] ?? null;
$grade = $dados['grade'] ?? null;
if (!is_string($unidade) || !unidade_existe(db(), $unidade) || !is_array($grade)) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Unidade ou grade inválida.']);
}

// Chave desconhecida (ex.: "feriado") e recusada em vez de ignorada.
$diasNomes = ['seg' => 'Segunda', 'ter' => 'Terça', 'qua' => 'Quarta', 'qui' => 'Quinta',
    'sex' => 'Sexta', 'sab' => 'Sábado', 'dom' => 'Domingo'];
foreach (array_keys($grade) as $chaveDia) {
    if (!isset($diasNomes[$chaveDia])) {
        responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Dia da semana inválido.']);
    }
}

// Valida dia a dia pra devolver uma mensagem que a dona entenda.
$motivos = [
    'dia' => 'dia inválido',
    'hora' => 'horário inválido',
    'modalidade' => 'nome da aula inválido (use só letras, números e / - & + . , ( ) \'; não pode começar com + ou -)',
    'duracao' => 'duração inválida (de ' . DURACAO_MIN . ' a ' . DURACAO_MAX . ' minutos)',
    'professor' => 'nome do professor inválido (não pode começar com + ou -)',
    'categoria' => 'categoria inválida (não pode começar com + ou -)',
    'estudio' => 'estúdio inválido (não pode começar com + ou -)',
];
$aulas = [];
foreach ($diasNomes as $dia => $nomeDia) {
    $doDia = $grade[$dia] ?? [];
    if (!is_array($doDia) || !array_is_list($doDia)) {
        responder(400, ['erro' => 'dados_invalidos', 'detalhe' => "{$nomeDia}: formato inválido."]);
    }
    foreach ($doDia as $i => $aula) {
        if (!is_array($aula)) {
            responder(400, ['erro' => 'dados_invalidos', 'detalhe' => "{$nomeDia}, aula " . ($i + 1) . ': formato inválido.']);
        }
        try {
            $aulas[] = validar_aula(['dia' => $dia] + $aula, $i + 1);
        } catch (InvalidArgumentException $e) {
            // A mensagem interna e "aula N: <campo> invalido(a)".
            $campo = 'dia';
            foreach (array_keys($motivos) as $c) {
                if (str_contains($e->getMessage(), ": {$c} ")) {
                    $campo = $c;
                }
            }
            responder(400, ['erro' => 'dados_invalidos', 'detalhe' => "{$nomeDia}, aula " . ($i + 1) . ": {$motivos[$campo]}."]);
        }
    }
}
if (count($aulas) > AULAS_MAX_POR_GRADE) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Aulas demais (máximo ' . AULAS_MAX_POR_GRADE . ').']);
}

// So estas duas: 'seed' e coisa do terminal, nunca da web.
$origem = ($dados['origem'] ?? null) === 'upload' ? 'upload' : 'edicao';

// 0 = a unidade nao tinha grade no ar quando o editor abriu. Sem o campo
// (planilha), nao confere.
$base = $dados['versao_base'] ?? null;
if ($base !== null && !(is_int($base) && $base >= 0)) {
    responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Versão base inválida.']);
}

try {
    $versao = salvar_nova_versao(db(), $unidade, $aulas, $origem, $adminId, $base);
} catch (GradeMudouException) {
    registrar('aviso', 'grade_mudou', ['admin_id' => $adminId, 'unidade' => $unidade, 'base' => $base]);
    responder(409, [
        'erro' => 'grade_mudou',
        'detalhe' => 'A grade desta unidade mudou desde que você abriu (outra aba ou o "Voltar"). '
            . 'Recarregue a página para ver a versão atual. Suas alterações não foram salvas.',
    ]);
}
registrar('info', 'grade_salva', ['admin_id' => $adminId, 'unidade' => $unidade, 'versao' => $versao, 'aulas' => count($aulas), 'origem' => $origem]);

responder(200, ['ok' => true, 'versao' => $versao]);
