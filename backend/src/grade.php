<?php
declare(strict_types=1);

// Regras da grade de aulas. As aulas em si vem do Pacto (src/pacto.php);
// aqui ficam a validacao do que chega de fora e o que o site junta a elas
// (cancelamentos).

require_once __DIR__ . '/cache.php';

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const MODALIDADE_MAX = 60;
const DURACAO_MIN = 5;
const DURACAO_MAX = 300;

// Texto que comeca com + ou - o Excel trata como formula ("+SUM(1)").
// (= e @ ja estao fora da lista branca.)
function comeca_como_formula(string $texto): bool
{
    return preg_match('/^[+\-]/', $texto) === 1;
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
    if ($duracao !== null && (!is_int($duracao) || $duracao < DURACAO_MIN || $duracao > DURACAO_MAX)) {
        throw new InvalidArgumentException("aula {$linha}: duracao invalida");
    }

    return ['dia' => $dia, 'hora' => $hora, 'modalidade' => $modalidade, 'duracao' => $duracao];
}

function unidade_existe(PDO $pdo, string $slug): bool
{
    $st = $pdo->prepare('SELECT 1 FROM unidades WHERE slug = ?');
    $st->execute([$slug]);
    return (bool) $st->fetchColumn();
}

// Janela que o site mostra: hoje + 6 dias, no fuso de Sao Paulo.
// (Mesma regra do proximosDias() do front: dia que passou sai, o mesmo dia
// da semana seguinte entra no fim.)
function janela_de_dias(?DateTimeImmutable $hoje = null): array
{
    $hoje ??= new DateTimeImmutable('today', new DateTimeZone('America/Sao_Paulo'));
    return [$hoje->format('Y-m-d'), $hoje->modify('+6 days')->format('Y-m-d')];
}

// Cancelamentos dos proximos 7 dias + o periodo, no formato que o front usa.
// (As aulas vem do Pacto: ver json_grades_publicas() em src/pacto.php.)
function cancelamentos_publicos(PDO $pdo): array
{
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
        'cancelamentos' => $st->fetchAll(),
        'periodo' => ['inicio' => $inicio, 'fim' => $fim],
    ];
}
