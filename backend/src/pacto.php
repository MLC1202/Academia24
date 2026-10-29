<?php
declare(strict_types=1);

// Grade de aulas lida do Pacto (sistema da academia), no lugar da planilha.
// A API e a mesma que a pagina agenda-aulas do Pacto usa: uma chamada por
// unidade e por dia, publica, sem login.
// shortcut: API nao documentada pelo Pacto; se mudar o formato, a grade para
// de atualizar (o site segue com a ultima copia boa). Ver pacto_buscar_grades.

require_once __DIR__ . '/grade.php';

// Chave publica da rede: ja aparece nos links de planos do front.
const PACTO_CHAVE = '95115352dc19ba38fc6b7c1f4931700d';
const PACTO_URL = 'https://app.pactosolucoes.com.br/api/prest/v2/vendas/' . PACTO_CHAVE . '/aulasColetivas';
const PACTO_UNIDADES = ['alphaville' => 1, 'cambui' => 2, 'lagoa' => 3, 'norte' => 4];
const PACTO_DIAS = 7;

// "FAST BIKE" -> "Fast Bike".
function pacto_nome_aula(string $descricao): string
{
    return mb_convert_case(mb_strtolower(trim($descricao)), MB_CASE_TITLE);
}

// Converte a resposta de UM dia no formato de aula do site. Aula que nao
// passa na validacao e descartada e anotada no log: dado de fora nao entra
// sem conferir.
function pacto_converter_dia(array $resposta, DateTimeImmutable $data, string $slug): array
{
    $dia = DIAS[(int) $data->format('N') - 1];
    $aulas = [];
    foreach ($resposta['return'] ?? [] as $periodo) {
        foreach ($periodo['aulas'] ?? [] as $bruta) {
            $duracao = $bruta['duracao'] ?? null;
            try {
                $limpa = validar_aula([
                    'dia' => $dia,
                    'hora' => $bruta['inicio'] ?? null,
                    'modalidade' => pacto_nome_aula((string) ($bruta['descricao'] ?? '')),
                    'duracao' => is_int($duracao) && $duracao >= DURACAO_MIN ? $duracao : null,
                ], count($aulas) + 1);
            } catch (InvalidArgumentException $e) {
                registrar('aviso', 'pacto_aula_descartada', [
                    'unidade' => $slug, 'data' => $data->format('Y-m-d'), 'motivo' => $e->getMessage(),
                ]);
                continue;
            }
            $aula = [
                'id' => $slug . '-' . $data->format('Ymd') . '-' . $limpa['hora'] . '-' . count($aulas),
                'hora' => $limpa['hora'],
                'modalidade' => $limpa['modalidade'],
            ];
            if ($limpa['duracao'] !== null) {
                $aula['duracao'] = $limpa['duracao'];
            }
            $aulas[] = $aula;
        }
    }
    usort($aulas, fn ($a, $b) => [$a['hora'], $a['modalidade']] <=> [$b['hora'], $b['modalidade']]);
    return $aulas;
}

// Busca varios (unidade, dia) em paralelo: 28 chamadas levam ~0,5 s; em fila
// seriam ~3 s. $pedidos = [[slug, DateTimeImmutable], ...]; devolve as aulas
// de cada um, na mesma ordem. Se QUALQUER chamada falhar, lanca: grade pela
// metade parece "sem aula" pro aluno, pior que mostrar a copia anterior.
function pacto_buscar_dias(array $pedidos): array
{
    $multi = curl_multi_init();
    $handles = [];
    try {
        foreach ($pedidos as [$slug, $data]) {
            $ch = curl_init(PACTO_URL . '/' . PACTO_UNIDADES[$slug] . '?' . http_build_query([
                'dia' => $data->format('d/m/Y'), 'plano' => 0, 'produto' => 0, 'linkVisitante' => 'false',
            ]));
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => 3,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_FOLLOWLOCATION => false,
                CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            ]);
            curl_multi_add_handle($multi, $ch);
            $handles[] = $ch;
        }

        do {
            $status = curl_multi_exec($multi, $ativos);
            if ($ativos) {
                curl_multi_select($multi, 1.0);
            }
        } while ($ativos && $status === CURLM_OK);

        $aulas = [];
        foreach ($pedidos as $i => [$slug, $data]) {
            $ch = $handles[$i];
            $onde = "{$slug} " . $data->format('Y-m-d');
            $codigo = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            if (curl_errno($ch) !== 0 || $codigo !== 200) {
                throw new RuntimeException("pacto {$onde}: " . (curl_error($ch) ?: "HTTP {$codigo}"));
            }
            $resposta = json_decode((string) curl_multi_getcontent($ch), true, 16, JSON_THROW_ON_ERROR);
            if (!is_array($resposta) || !is_array($resposta['return'] ?? null)) {
                throw new RuntimeException("pacto {$onde}: formato inesperado");
            }
            $aulas[] = pacto_converter_dia($resposta, $data, $slug);
        }
        return $aulas;
    } finally {
        foreach ($handles as $ch) {
            curl_multi_remove_handle($multi, $ch);
            curl_close($ch);
        }
        curl_multi_close($multi);
    }
}

// Os proximos 7 dias (hoje incluido, como o site mostra) das 4 unidades.
// Devolve { slug: { seg: [...], ... } }.
function pacto_buscar_grades(?DateTimeImmutable $hoje = null): array
{
    $hoje ??= new DateTimeImmutable('today', new DateTimeZone('America/Sao_Paulo'));

    $pedidos = [];
    foreach (array_keys(PACTO_UNIDADES) as $slug) {
        for ($i = 0; $i < PACTO_DIAS; $i++) {
            $pedidos[] = [$slug, $hoje->modify("+{$i} days")];
        }
    }

    $grades = array_map(fn () => array_fill_keys(DIAS, []), PACTO_UNIDADES);
    foreach (pacto_buscar_dias($pedidos) as $i => $aulas) {
        [$slug, $data] = $pedidos[$i];
        $grades[$slug][DIAS[(int) $data->format('N') - 1]] = $aulas;
    }
    return $grades;
}

// As aulas de UM dia de uma unidade (usado pelo cancelamento).
function pacto_buscar_dia(string $slug, DateTimeImmutable $data): array
{
    return pacto_buscar_dias([[$slug, $data]])[0];
}

// O JSON que GET /api/grades.php serve: aulas do Pacto + cancelamentos do
// banco. Lanca RuntimeException/JsonException se o Pacto falhar.
function json_grades_publicas(PDO $pdo): string
{
    return json_encode(
        ['grades' => pacto_buscar_grades()] + cancelamentos_publicos($pdo),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
    );
}
