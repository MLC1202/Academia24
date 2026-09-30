<?php
declare(strict_types=1);

// Regras da grade de aulas. Tudo que GRAVA grade passa por aqui (o seed
// agora, o upload do Excel depois), entao a validacao existe num lugar so.

require_once __DIR__ . '/cache.php';

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const ORIGENS = ['upload', 'edicao', 'seed'];
const MODALIDADE_MAX = 60;
const AULAS_MAX_POR_GRADE = 500;

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
    ) {
        throw new InvalidArgumentException("aula {$linha}: modalidade invalida");
    }

    return ['dia' => $dia, 'hora' => $hora, 'modalidade' => $modalidade];
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
function salvar_nova_versao(
    PDO $pdo,
    string $unidade,
    array $aulas,
    string $origem,
    ?int $adminId,
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
        $pdo->prepare('INSERT INTO grade_versoes (unidade, origem, criada_por) VALUES (?, ?, ?)')
            ->execute([$unidade, $origem, $adminId]);
        $versaoId = (int) $pdo->lastInsertId();

        $insere = $pdo->prepare('INSERT INTO aulas (versao_id, dia, hora, modalidade) VALUES (?, ?, ?, ?)');
        foreach ($limpas as $a) {
            $insere->execute([$versaoId, $a['dia'], $a['hora'], $a['modalidade']]);
        }

        $pdo->prepare('UPDATE unidades SET grade_ativa_id = ? WHERE slug = ?')
            ->execute([$versaoId, $unidade]);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    // Grade mudou: o site tem que ver na hora, nao daqui a um minuto.
    cache_limpar('grades');
    return $versaoId;
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

    // Toda unidade aparece, mesmo sem grade ativa (fica com os dias vazios).
    foreach ($pdo->query('SELECT slug FROM unidades ORDER BY slug') as $u) {
        $grades[$u['slug']] = array_fill_keys(DIAS, []);
    }

    // So as aulas da versao ATIVA de cada unidade. ORDER BY dia segue a ordem
    // do ENUM (seg..dom).
    $aulas = $pdo->query(
        "SELECT u.slug, a.id, a.dia, TIME_FORMAT(a.hora, '%H:%i') AS hora, a.modalidade
           FROM unidades u
           JOIN aulas a ON a.versao_id = u.grade_ativa_id
          ORDER BY u.slug, a.dia, a.hora, a.modalidade"
    );
    foreach ($aulas as $a) {
        $grades[$a['slug']][$a['dia']][] = [
            'id' => (string) $a['id'],
            'hora' => $a['hora'],
            'modalidade' => $a['modalidade'],
        ];
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
        'cancelamentos' => $st->fetchAll(),
        'periodo' => ['inicio' => $inicio, 'fim' => $fim],
    ];
}
