<?php
declare(strict_types=1);

// Regras da grade de aulas. Tudo que GRAVA grade passa por aqui (o seed
// agora, o upload do Excel depois), entao a validacao existe num lugar so.

require_once __DIR__ . '/cache.php';

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const ORIGENS = ['upload', 'edicao', 'seed'];
const MODALIDADE_MAX = 60;
const AULAS_MAX_POR_GRADE = 500;

// Detalhes opcionais (vindos da planilha). campo => tamanho maximo.
// Todos usam a mesma lista branca do nome da aula.
// (Observacoes da planilha ficam de fora de proposito: eram anotacoes
// internas, nao recado pra aluno.)
const DETALHES = [
    'professor' => 60,
    'categoria' => 40,
    'estudio' => 40,
];
const DURACAO_MIN = 5;
const DURACAO_MAX = 300;

// Quantas versoes da grade guardar por unidade (alem da que esta no ar e
// da que o "Desfazer" usaria, que nunca sao apagadas). Decidido em 06/10/2026.
const VERSOES_GUARDADAS = 20;

// A grade no ar mudou desde que o editor abriu (outra aba/pessoa salvou ou
// desfez). Salvar agora apagaria a mudanca do outro sem ninguem ver.
final class GradeMudouException extends RuntimeException
{
}

// Texto que comeca com + ou - o Excel trata como formula ("+SUM(1)").
// (= e @ ja estao fora da lista branca.)
function comeca_como_formula(string $texto): bool
{
    return preg_match('/^[+\-]/', $texto) === 1;
}

// Texto opcional: devolve null se vazio, o texto limpo se valido, ou lanca.
function validar_detalhe(mixed $valor, string $campo, int $linha): ?string
{
    if ($valor === null || $valor === '') {
        return null;
    }
    $max = DETALHES[$campo];
    if (!is_string($valor) || !mb_check_encoding($valor, 'UTF-8')) {
        throw new InvalidArgumentException("aula {$linha}: {$campo} invalido");
    }
    $valor = trim(preg_replace('/\s+/u', ' ', $valor));
    if ($valor === '') {
        return null;
    }
    if (
        mb_strlen($valor) > $max
        || !preg_match("/^[\\p{L}\\p{N} \\/\\-&+.,()']+$/u", $valor)
        || comeca_como_formula($valor)
    ) {
        throw new InvalidArgumentException("aula {$linha}: {$campo} invalido");
    }
    return $valor;
}

// Confere uma aula e devolve ela limpa. Se algo estiver errado, lanca
// InvalidArgumentException com a linha e o motivo (sem ecoar o conteudo).
function validar_aula(mixed $aula, int $linha): array
{
    if (!is_array($aula)) {
        throw new InvalidArgumentException("aula {$linha}: formato invalido");
    }

    $dia = $aula['dia'] ?? null;
    if (!is_string($dia) || !in_array($dia, DIAS, true)) {
        throw new InvalidArgumentException("aula {$linha}: dia invalido");
    }

    // 24h, 'HH:MM', de 00:00 a 23:59.
    $hora = $aula['hora'] ?? null;
    if (!is_string($hora) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $hora)) {
        throw new InvalidArgumentException("aula {$linha}: hora invalida");
    }

    $modalidade = $aula['modalidade'] ?? null;
    if (!is_string($modalidade) || !mb_check_encoding($modalidade, 'UTF-8')) {
        throw new InvalidArgumentException("aula {$linha}: modalidade invalida");
    }
    // Junta espacos repetidos/quebras de linha e tira das pontas.
    $modalidade = trim(preg_replace('/\s+/u', ' ', $modalidade));
    if (
        $modalidade === ''
        || mb_strlen($modalidade) > MODALIDADE_MAX
        // Lista branca: letras (com acento), numeros, espaco e / - & + . , ( ) '
        // Nome de aula nunca precisa de < > ; " etc. Barrar aqui e uma camada
        // a mais -- o React tambem escapa na hora de mostrar.
        || !preg_match("/^[\\p{L}\\p{N} \\/\\-&+.,()']+$/u", $modalidade)
        || comeca_como_formula($modalidade)
    ) {
        throw new InvalidArgumentException("aula {$linha}: modalidade invalida");
    }

    $duracao = $aula['duracao'] ?? null;
    if ($duracao !== null && $duracao !== '') {
        if (!is_int($duracao) || $duracao < DURACAO_MIN || $duracao > DURACAO_MAX) {
            throw new InvalidArgumentException("aula {$linha}: duracao invalida");
        }
    } else {
        $duracao = null;
    }

    $limpa = ['dia' => $dia, 'hora' => $hora, 'modalidade' => $modalidade, 'duracao' => $duracao];
    foreach (array_keys(DETALHES) as $campo) {
        $limpa[$campo] = validar_detalhe($aula[$campo] ?? null, $campo, $linha);
    }
    return $limpa;
}

function unidade_existe(PDO $pdo, string $slug): bool
{
    $st = $pdo->prepare('SELECT 1 FROM unidades WHERE slug = ?');
    $st->execute([$slug]);
    return (bool) $st->fetchColumn();
}

// Grava uma grade nova para a unidade e ja coloca ela no ar.
// A versao anterior NAO e apagada: continua em grade_versoes (rollback).
// Tudo numa transacao: ou entra a grade inteira, ou nada muda.
//
// $versaoBase: a versao que o editor carregou (0 = nenhuma no ar). Se a do
// ar for outra, lanca GradeMudouException e nada e gravado (controle de
// concorrencia otimista). null = sem conferencia (seed, planilha: substituir
// e a intencao).
function salvar_nova_versao(
    PDO $pdo,
    string $unidade,
    array $aulas,
    string $origem,
    ?int $adminId,
    ?int $versaoBase = null,
): int {
    if (!in_array($origem, ORIGENS, true)) {
        throw new InvalidArgumentException('origem invalida');
    }
    if (!unidade_existe($pdo, $unidade)) {
        throw new InvalidArgumentException('unidade invalida');
    }
    if (count($aulas) > AULAS_MAX_POR_GRADE) {
        throw new InvalidArgumentException('aulas demais');
    }

    // Valida TUDO antes de tocar no banco.
    $limpas = [];
    foreach (array_values($aulas) as $i => $aula) {
        $limpas[] = validar_aula($aula, $i + 1);
    }

    $pdo->beginTransaction();
    try {
        // FOR UPDATE: trava a linha da unidade ate o commit. Dois salvamentos
        // ao mesmo tempo ficam em fila, e o segundo ja ve a versao do primeiro.
        $st = $pdo->prepare('SELECT grade_ativa_id FROM unidades WHERE slug = ? FOR UPDATE');
        $st->execute([$unidade]);
        $ativa = $st->fetchColumn();
        $ativa = ($ativa === false || $ativa === null) ? null : (int) $ativa;
        if ($versaoBase !== null && $versaoBase !== ($ativa ?? 0)) {
            throw new GradeMudouException('grade mudou desde que o editor abriu');
        }

        // anterior_id = a que estava no ar: e pra ela que o "Desfazer" volta.
        $pdo->prepare('INSERT INTO grade_versoes (unidade, origem, criada_por, anterior_id) VALUES (?, ?, ?, ?)')
            ->execute([$unidade, $origem, $adminId, $ativa]);
        $versaoId = (int) $pdo->lastInsertId();

        $insere = $pdo->prepare(
            'INSERT INTO aulas (versao_id, dia, hora, modalidade, duracao_min, professor, categoria, estudio)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($limpas as $a) {
            $insere->execute([
                $versaoId, $a['dia'], $a['hora'], $a['modalidade'],
                $a['duracao'], $a['professor'], $a['categoria'], $a['estudio'],
            ]);
        }

        $pdo->prepare('UPDATE unidades SET grade_ativa_id = ? WHERE slug = ?')
            ->execute([$versaoId, $unidade]);

        apagar_versoes_antigas($pdo, $unidade, $versaoId, $ativa);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    // Grade mudou: o site tem que ver na hora, nao daqui a um minuto.
    cache_limpar('grades');
    return $versaoId;
}

// Mantem so as VERSOES_GUARDADAS mais novas da unidade, mais a do ar e a do
// "Desfazer" (que podem ser mais velhas depois de varios desfazer). As aulas
// das apagadas vao junto (ON DELETE CASCADE).
function apagar_versoes_antigas(PDO $pdo, string $unidade, int $noAr, ?int $doDesfazer): void
{
    $st = $pdo->prepare(
        'SELECT id FROM grade_versoes WHERE unidade = ? ORDER BY id DESC LIMIT 1 OFFSET ' . (VERSOES_GUARDADAS - 1)
    );
    $st->execute([$unidade]);
    $corte = $st->fetchColumn();
    if ($corte === false) {
        return; // ainda nao passou do limite
    }
    $pdo->prepare('DELETE FROM grade_versoes WHERE unidade = ? AND id < ? AND id NOT IN (?, ?)')
        ->execute([$unidade, (int) $corte, $noAr, $doDesfazer ?? 0]);
}

// ---------------------------------------------------------------------------
// Leitura publica (o que o site mostra)
// ---------------------------------------------------------------------------

// Janela que o site mostra: hoje + 6 dias, no fuso de Sao Paulo.
// (Mesma regra do proximosDias() do front: dia que passou sai, o mesmo dia
// da semana seguinte entra no fim.)
function janela_de_dias(?DateTimeImmutable $hoje = null): array
{
    $hoje ??= new DateTimeImmutable('today', new DateTimeZone('America/Sao_Paulo'));
    return [$hoje->format('Y-m-d'), $hoje->modify('+6 days')->format('Y-m-d')];
}

// Monta exatamente o formato que o front usa (tipo Grades do grade.ts):
//   { "alphaville": { "seg": [ {id, hora, modalidade}, ... ], ... }, ... }
// + os cancelamentos dos proximos 7 dias.
function carregar_grades_publicas(PDO $pdo): array
{
    $grades = [];
    $versoes = [];

    // Toda unidade aparece, mesmo sem grade ativa (fica com os dias vazios).
    // "versoes" (qual versao esta no ar) e o que o editor do dashboard manda
    // de volta ao salvar, pra saber se outra aba mudou a grade no meio.
    foreach ($pdo->query('SELECT slug, grade_ativa_id FROM unidades ORDER BY slug') as $u) {
        $grades[$u['slug']] = array_fill_keys(DIAS, []);
        $versoes[$u['slug']] = $u['grade_ativa_id'] === null ? null : (int) $u['grade_ativa_id'];
    }

    // So as aulas da versao ATIVA de cada unidade. ORDER BY dia segue a ordem
    // do ENUM (seg..dom).
    $aulas = $pdo->query(
        "SELECT u.slug, a.id, a.dia, TIME_FORMAT(a.hora, '%H:%i') AS hora, a.modalidade,
                a.duracao_min, a.professor, a.categoria, a.estudio
           FROM unidades u
           JOIN aulas a ON a.versao_id = u.grade_ativa_id
          ORDER BY u.slug, a.dia, a.hora, a.modalidade"
    );
    foreach ($aulas as $a) {
        $aula = [
            'id' => (string) $a['id'],
            'hora' => $a['hora'],
            'modalidade' => $a['modalidade'],
        ];
        // Detalhes so entram no JSON quando existem (resposta menor).
        if ($a['duracao_min'] !== null) {
            $aula['duracao'] = (int) $a['duracao_min'];
        }
        foreach (array_keys(DETALHES) as $campo) {
            if ($a[$campo] !== null) {
                $aula[$campo] = $a[$campo];
            }
        }
        $grades[$a['slug']][$a['dia']][] = $aula;
    }

    [$inicio, $fim] = janela_de_dias();
    $st = $pdo->prepare(
        "SELECT unidade, DATE_FORMAT(data, '%Y-%m-%d') AS data,
                TIME_FORMAT(hora, '%H:%i') AS hora, modalidade
           FROM cancelamentos
          WHERE data BETWEEN ? AND ?
          ORDER BY data, hora"
    );
    $st->execute([$inicio, $fim]);

    return [
        'grades' => $grades,
        'versoes' => $versoes,
        'cancelamentos' => $st->fetchAll(),
        'periodo' => ['inicio' => $inicio, 'fim' => $fim],
    ];
}

// ---------------------------------------------------------------------------
// Versoes (historico + desfazer)
// ---------------------------------------------------------------------------

// Ultimas versoes de uma unidade, da mais nova pra mais antiga.
// Alem das $limite mais novas, SEMPRE inclui a que esta no ar e a do
// "Desfazer" (anterior_id da do ar). Depois de muitos "Desfazer" a do ar
// pode ser mais velha que as 10 ultimas; sem isso o painel dizia
// "nenhuma grade publicada" e travava o botao.
function listar_versoes(PDO $pdo, string $unidade, int $limite = 10): array
{
    $st = $pdo->prepare(
        "SELECT v.id, v.origem,
                DATE_FORMAT(v.criada_em, '%Y-%m-%dT%H:%i:%sZ') AS criada_em,
                (SELECT COUNT(*) FROM aulas a WHERE a.versao_id = v.id) AS aulas,
                (v.id = u.grade_ativa_id) AS ativa,
                (v.id <=> ar.anterior_id) AS desfazer
           FROM grade_versoes v
           JOIN unidades u ON u.slug = v.unidade
           LEFT JOIN grade_versoes ar ON ar.id = u.grade_ativa_id
          WHERE v.unidade = ?
            AND (v.id IN (SELECT id FROM (SELECT id FROM grade_versoes
                                           WHERE unidade = ?
                                           ORDER BY id DESC
                                           LIMIT " . max(1, min(50, $limite)) . ") AS ultimas)
                 OR v.id = u.grade_ativa_id
                 OR v.id <=> ar.anterior_id)
          ORDER BY v.id DESC"
    );
    $st->execute([$unidade, $unidade]);
    return array_map(fn($v) => [
        'id' => (int) $v['id'],
        'origem' => $v['origem'],
        'criada_em' => $v['criada_em'],
        'aulas' => (int) $v['aulas'],
        'ativa' => (bool) $v['ativa'],
        'desfazer' => (bool) $v['desfazer'],
    ], $st->fetchAll());
}

// "Desfazer": coloca no ar a versao que estava no ar ANTES da atual
// (anterior_id), ou seja, volta no tempo. Nada e apagado: a que saiu continua
// no historico. Chamar de novo volta mais um passo. Devolve o id que entrou,
// ou null se nao ha anterior.
function voltar_versao_anterior(PDO $pdo, string $unidade): ?int
{
    $pdo->beginTransaction();
    try {
        // FOR UPDATE: duas abas clicando ao mesmo tempo nao se atropelam.
        $st = $pdo->prepare('SELECT grade_ativa_id FROM unidades WHERE slug = ? FOR UPDATE');
        $st->execute([$unidade]);
        $ativa = $st->fetchColumn();
        if ($ativa === false || $ativa === null) {
            $pdo->rollBack();
            return null;
        }

        $st = $pdo->prepare('SELECT anterior_id FROM grade_versoes WHERE id = ?');
        $st->execute([$ativa]);
        $anterior = $st->fetchColumn();
        if ($anterior === false || $anterior === null) {
            $pdo->rollBack();
            return null;
        }

        $pdo->prepare('UPDATE unidades SET grade_ativa_id = ? WHERE slug = ?')
            ->execute([$anterior, $unidade]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    cache_limpar('grades');
    return (int) $anterior;
}
