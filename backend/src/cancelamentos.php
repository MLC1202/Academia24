<?php
declare(strict_types=1);

// Cancelamento de aula pelo dashboard (so admin).
//
// Decidido com o Matheus em 01/10/2026:
//  - fica dentro da aba Grade do dashboard;
//  - da pra cancelar de hoje ate 60 dias a frente (o site mostra quando a
//    data entra na janela de 7 dias);
//  - cancela uma aula OU o dia inteiro (feriado/manutencao) e desfaz igual.
//
// Cancelamento vale para UMA data real (so aquela semana). A tabela
// cancelamentos ja existe desde a 001 e o site ja risca a aula; aqui so
// entram as regras de gravar e apagar.
//
// So da pra cancelar aula que EXISTE na grade publicada daquela unidade,
// naquele dia da semana. Assim nenhum texto inventado vai parar no JSON
// publico do site.

require_once __DIR__ . '/grade.php'; // DIAS, unidade_existe, cache

const CANCEL_DIAS_FRENTE = 60;
const FUSO_SITE = 'America/Sao_Paulo';

function hoje_no_site(): DateTimeImmutable
{
    return new DateTimeImmutable('today', new DateTimeZone(FUSO_SITE));
}

// 'AAAA-MM-DD' de verdade (rejeita 2026-02-30). null se invalida.
function ler_data(mixed $v): ?DateTimeImmutable
{
    if (!is_string($v) || preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) !== 1) {
        return null;
    }
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $v, new DateTimeZone(FUSO_SITE));
    return $d !== false && $d->format('Y-m-d') === $v ? $d : null;
}

// Pode CANCELAR nesta data? (hoje .. hoje + 60)
function data_cancelavel(DateTimeImmutable $d): bool
{
    $hoje = hoje_no_site();
    return $d >= $hoje && $d <= $hoje->modify('+' . CANCEL_DIAS_FRENTE . ' days');
}

function ler_hora(mixed $v): ?string
{
    return is_string($v) && preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $v) === 1 ? $v : null;
}

function ler_modalidade(mixed $v): ?string
{
    if (!is_string($v)) {
        return null;
    }
    $v = trim($v);
    return $v !== '' && mb_strlen($v) <= MODALIDADE_MAX ? $v : null;
}

// 'seg'..'dom' da data (N: 1 = segunda ... 7 = domingo).
function dia_da_semana(DateTimeImmutable $d): string
{
    return DIAS[(int) $d->format('N') - 1];
}

// Aulas da grade PUBLICADA da unidade no dia da semana da data, cada uma
// dizendo se ja esta cancelada naquela data.
function aulas_da_data(PDO $pdo, string $unidade, DateTimeImmutable $data): array
{
    $st = $pdo->prepare(
        "SELECT TIME_FORMAT(a.hora, '%H:%i') AS hora, a.modalidade,
                (c.id IS NOT NULL) AS cancelada
           FROM unidades u
           JOIN aulas a ON a.versao_id = u.grade_ativa_id AND a.dia = ?
           LEFT JOIN cancelamentos c
                  ON c.unidade = u.slug AND c.data = ? AND c.hora = a.hora AND c.modalidade = a.modalidade
          WHERE u.slug = ?
          ORDER BY a.hora, a.modalidade"
    );
    $st->execute([dia_da_semana($data), $data->format('Y-m-d'), $unidade]);
    return array_map(fn(array $a): array => [
        'hora' => $a['hora'],
        'modalidade' => $a['modalidade'],
        'cancelada' => (bool) $a['cancelada'],
    ], $st->fetchAll());
}

// Cancelamentos de hoje em diante da unidade (pra lista "Proximos").
function proximos_cancelamentos(PDO $pdo, string $unidade): array
{
    $st = $pdo->prepare(
        "SELECT DATE_FORMAT(data, '%Y-%m-%d') AS data, TIME_FORMAT(hora, '%H:%i') AS hora, modalidade
           FROM cancelamentos
          WHERE unidade = ? AND data >= ?
          ORDER BY data, hora, modalidade
          LIMIT 300"
    );
    $st->execute([$unidade, hoje_no_site()->format('Y-m-d')]);
    return $st->fetchAll();
}

// Grava os cancelamentos (uma aula ou varias) numa transacao. Devolve
// quantos eram NOVOS (o que ja estava cancelado so e ignorado).
function gravar_cancelamentos(PDO $pdo, string $unidade, DateTimeImmutable $data, array $aulas, int $adminId): int
{
    $ins = $pdo->prepare(
        'INSERT INTO cancelamentos (unidade, data, hora, modalidade, criado_por)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id'
    );
    $novos = 0;
    $pdo->beginTransaction();
    try {
        foreach ($aulas as $a) {
            $ins->execute([$unidade, $data->format('Y-m-d'), $a['hora'], $a['modalidade'], $adminId]);
            $novos += $ins->rowCount() === 1 ? 1 : 0; // 1 = inseriu; 0 = ja existia
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    cache_limpar('grades'); // o site ve na hora
    return $novos;
}

// Desfaz: uma aula (hora + modalidade) ou o dia inteiro (null). Funciona
// mesmo se a aula ja saiu da grade (cancelamento "orfao" da lista).
function apagar_cancelamentos(PDO $pdo, string $unidade, DateTimeImmutable $data, ?string $hora, ?string $modalidade): int
{
    if ($hora === null) {
        $st = $pdo->prepare('DELETE FROM cancelamentos WHERE unidade = ? AND data = ?');
        $st->execute([$unidade, $data->format('Y-m-d')]);
    } else {
        $st = $pdo->prepare(
            'DELETE FROM cancelamentos WHERE unidade = ? AND data = ? AND hora = ? AND modalidade = ?'
        );
        $st->execute([$unidade, $data->format('Y-m-d'), $hora, $modalidade]);
    }
    cache_limpar('grades');
    return $st->rowCount();
}

// Le e confere o corpo dos POSTs de cancelar/desfazer. Formatos aceitos:
//   { unidade, data, hora, modalidade }      -> uma aula
//   { unidade, data, dia_inteiro: true }     -> o dia todo
// Devolve [unidade, data, hora|null, modalidade|null] ou responde 400.
function ler_pedido_cancelamento(PDO $pdo, array $j): array
{
    $permitidos = ['unidade', 'data', 'hora', 'modalidade', 'dia_inteiro'];
    if (array_diff(array_keys($j), $permitidos)) {
        responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Campo desconhecido.']);
    }
    $unidade = $j['unidade'] ?? null;
    if (!is_string($unidade) || !unidade_existe($pdo, $unidade)) {
        responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Unidade inválida.']);
    }
    $data = ler_data($j['data'] ?? null);
    if ($data === null) {
        responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Data inválida.']);
    }

    $diaInteiro = ($j['dia_inteiro'] ?? false) === true;
    $temAula = array_key_exists('hora', $j) || array_key_exists('modalidade', $j);
    if ($diaInteiro === $temAula) {
        // Ou uma aula, ou o dia inteiro. Os dois (ou nenhum) = pedido estranho.
        responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Escolha uma aula ou o dia inteiro.']);
    }
    if ($diaInteiro) {
        return [$unidade, $data, null, null];
    }
    $hora = ler_hora($j['hora'] ?? null);
    $modalidade = ler_modalidade($j['modalidade'] ?? null);
    if ($hora === null || $modalidade === null) {
        responder(400, ['erro' => 'dados_invalidos', 'detalhe' => 'Aula inválida.']);
    }
    return [$unidade, $data, $hora, $modalidade];
}
