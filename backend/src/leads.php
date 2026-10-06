<?php
declare(strict_types=1);

// Regras do formulario "Agende sua aula experimental" (leads).
//
// O front valida so por conforto. Quem decide e AQUI, por lista branca:
// o que nao esta explicitamente permitido e recusado.

// Versao do texto da caixinha de consentimento. Se o texto mudar no
// FormAgendamento.tsx, mude a data LA e AQUI (o lead grava qual texto a
// pessoa aceitou -- e a prova da LGPD).
const LEAD_CONSENTIMENTO_VERSAO = '2026-10-06';

const LEAD_PERIODOS = ['manha', 'tarde', 'noite'];
const LEAD_OBJETIVOS = ['saude', 'emagrecimento', 'massamuscular', 'condicionamento', 'retomar'];

// Campos que o JSON pode ter. Qualquer outro = recusa (ninguem "enfia" um
// status ou um id pelo formulario).
const LEAD_CAMPOS = [
    'unidade', 'periodo', 'objetivo', 'nome', 'telefone', 'email',
    'consentimento', 'consentimento_versao',
    'referencia', // honeypot: campo escondido, pessoa nunca preenche
];

// Anti-spam (decidido com o Matheus em 01/10/2026).
// 20/h por IP: operadora de celular (CGNAT) e Wi-Fi da academia colocam
// muita gente atras de um IP so. Quem segura repeticao e o limite por e-mail.
const LEAD_MAX_POR_IP = 20;         // por hora
const LEAD_JANELA_IP_SEG = 3600;
const LEAD_MAX_POR_EMAIL = 3;       // por dia
const LEAD_JANELA_EMAIL_SEG = 86400;
const LEAD_TEMPO_MINIMO_SEG = 3;    // abrir a pagina e enviar em menos que isso = robo

// Nome: letras (com acento), espaco, apostrofo, hifen e ponto ("Jr.").
// Precisa de nome e sobrenome. Devolve o nome limpo ou null.
function limpar_nome(mixed $v): ?string
{
    if (!is_string($v)) {
        return null;
    }
    $v = str_replace(["\u{2019}", "\u{00B4}", '`'], "'", $v);   // apostrofos "bonitos" -> '
    $v = trim((string) preg_replace('/\s+/u', ' ', $v));
    if (class_exists('Normalizer')) {
        $v = (string) Normalizer::normalize($v, Normalizer::FORM_C);
    }
    $tam = mb_strlen($v);
    if ($tam < 3 || $tam > 100) {
        return null;
    }
    // Comeca com letra: "-", "'" ou "." no inicio nunca entram (tambem
    // evita formula de Excel na exportacao).
    if (preg_match("/^\\p{L}[\\p{L}\\p{M}' .-]*$/u", $v) !== 1) {
        return null;
    }
    // Pelo menos 2 palavras com letra de verdade.
    $palavras = array_filter(explode(' ', $v), fn($p) => preg_match('/\p{L}/u', $p) === 1);
    return count($palavras) >= 2 ? $v : null;
}

// Telefone BR: aceita "(11) 98765-4321", "11987654321", "+55 11 ...".
// Devolve so os digitos (DDD + numero) ou null.
function limpar_telefone(mixed $v): ?string
{
    if (!is_string($v) || strlen($v) > 25 || preg_match('/^[0-9()\s+.-]+$/', $v) !== 1) {
        return null;
    }
    $d = (string) preg_replace('/\D/', '', $v);
    if ((strlen($d) === 12 || strlen($d) === 13) && str_starts_with($d, '55')) {
        $d = substr($d, 2); // tira o +55
    }
    if (preg_match('/^[1-9][1-9]/', $d) !== 1) {
        return null; // DDD nao tem zero
    }
    if (strlen($d) === 11) {
        return $d[2] === '9' ? $d : null;           // celular: 9XXXX-XXXX
    }
    if (strlen($d) === 10) {
        return preg_match('/^[2-8]$/', $d[2]) === 1 ? $d : null; // fixo
    }
    return null;
}

function limpar_email(mixed $v): ?string
{
    if (!is_string($v)) {
        return null;
    }
    $v = mb_strtolower(trim($v));
    if (strlen($v) > 254 || filter_var($v, FILTER_VALIDATE_EMAIL) === false) {
        return null;
    }
    // Comecando com = + - @ o Excel trataria como formula na exportacao.
    // E-mail de verdade nao comeca assim.
    if (preg_match('/^[=+\-@]/', $v) === 1) {
        return null;
    }
    $dominio = substr($v, strrpos($v, '@') + 1);
    return str_contains($dominio, '.') ? $v : null;
}

// Valida o JSON inteiro. Devolve [dados_limpos, erros_por_campo].
// $unidadesValidas vem do banco (tabela unidades).
function validar_lead(array $j, array $unidadesValidas): array
{
    $listas = [
        'unidade' => $unidadesValidas,
        'periodo' => LEAD_PERIODOS,
        'objetivo' => LEAD_OBJETIVOS,
    ];
    $limpadores = [
        'nome' => 'limpar_nome',
        'telefone' => 'limpar_telefone',
        'email' => 'limpar_email',
    ];

    $erros = [];
    $ok = [];

    foreach ($listas as $campo => $permitidos) {
        $v = $j[$campo] ?? null;
        if (is_string($v) && in_array($v, $permitidos, true)) {
            $ok[$campo] = $v;
        } else {
            $erros[$campo] = 'invalido';
        }
    }

    foreach ($limpadores as $campo => $funcao) {
        $v = $funcao($j[$campo] ?? null);
        if ($v !== null) {
            $ok[$campo] = $v;
        } else {
            $erros[$campo] = 'invalido';
        }
    }

    // Tem que ser o booleano true. "true", 1 ou "sim" nao valem.
    if (($j['consentimento'] ?? null) !== true) {
        $erros['consentimento'] = 'obrigatorio';
    }

    return [$ok, $erros];
}

// Se o navegador mandou Origin, tem que ser este mesmo site. (O token CSRF
// ja garante isso; e uma segunda trava, barata.)
function exigir_mesma_origem(): void
{
    $origem = $_SERVER['HTTP_ORIGIN'] ?? null;
    if ($origem === null) {
        return; // navegador antigo ou chamada sem navegador: o CSRF segura
    }
    $partes = parse_url((string) $origem);
    $nome = strtolower((string) ($partes['host'] ?? ''));
    $host = $nome . (isset($partes['port']) ? ':' . $partes['port'] : '');

    // Em dev o proxy do Vite troca o Host pra localhost:8080, entao a origem
    // (localhost:5173) nunca bate. So em dev aceito a propria maquina.
    if (!em_producao() && in_array($nome, ['localhost', '127.0.0.1'], true)) {
        return;
    }

    if ($nome === '' || !hash_equals(strtolower((string) ($_SERVER['HTTP_HOST'] ?? '')), $host)) {
        registrar('aviso', 'origem_recusada', []);
        responder(403, ['erro' => 'origem_invalida']);
    }
}

// ---------------------------------------------------------------------------
// Dashboard (so admin): listar, mudar status, excluir.
// ---------------------------------------------------------------------------

const LEAD_STATUS = ['novo', 'contatado', 'matriculou', 'descartado'];
const LEAD_POR_PAGINA = 50;

// LGPD: lead mais velho que isso e apagado pelo bin/limpar-leads.php (Cron).
// Decidido com o Matheus em 01/10/2026. Conta a partir de criado_em,
// qualquer que seja o status.
const LEAD_RETENCAO_MESES = 6;

// Lista com filtros opcionais. Mais novos primeiro. Datas em ISO UTC; o
// navegador converte pro horario de Brasilia.
// Devolve [linhas da pagina, total com o filtro, contagem por status].
function listar_leads(PDO $pdo, ?string $unidade, ?string $status, int $pagina): array
{
    $onde = [];
    $args = [];
    if ($unidade !== null) {
        $onde[] = 'unidade = ?';
        $args[] = $unidade;
    }
    // Contagem por status respeita so a unidade (pros numeros das abas).
    $whereUnidade = $onde ? 'WHERE ' . implode(' AND ', $onde) : '';
    $st = $pdo->prepare("SELECT status, COUNT(*) AS n FROM leads $whereUnidade GROUP BY status");
    $st->execute($args);
    $contagem = array_fill_keys(LEAD_STATUS, 0);
    foreach ($st->fetchAll() as $l) {
        $contagem[$l['status']] = (int) $l['n'];
    }

    if ($status !== null) {
        $onde[] = 'status = ?';
        $args[] = $status;
    }
    $where = $onde ? 'WHERE ' . implode(' AND ', $onde) : '';

    $st = $pdo->prepare("SELECT COUNT(*) FROM leads $where");
    $st->execute($args);
    $total = (int) $st->fetchColumn();

    // LIMIT/OFFSET tambem vao como parametro (inteiros), nunca colados.
    $st = $pdo->prepare(
        "SELECT id, unidade, periodo, objetivo, nome, telefone, email, status,
                DATE_FORMAT(criado_em, '%Y-%m-%dT%H:%i:%sZ') AS criado_em,
                DATE_FORMAT(status_em, '%Y-%m-%dT%H:%i:%sZ') AS status_em
           FROM leads $where
          ORDER BY criado_em DESC, id DESC
          LIMIT ? OFFSET ?"
    );
    $st->execute([...$args, LEAD_POR_PAGINA, ($pagina - 1) * LEAD_POR_PAGINA]);
    $linhas = array_map(function (array $l): array {
        $l['id'] = (int) $l['id'];
        return $l;
    }, $st->fetchAll());

    return [$linhas, $total, $contagem];
}

// Exportacao (botao "Exportar Excel"): TODOS os leads do filtro, sem paginar,
// mais novos primeiro. O .xlsx e montado no navegador.
const LEAD_EXPORTAR_MAX = 10000;

function exportar_leads(PDO $pdo, ?string $unidade, ?string $status): array
{
    $onde = [];
    $args = [];
    if ($unidade !== null) {
        $onde[] = 'unidade = ?';
        $args[] = $unidade;
    }
    if ($status !== null) {
        $onde[] = 'status = ?';
        $args[] = $status;
    }
    $where = $onde ? 'WHERE ' . implode(' AND ', $onde) : '';
    $st = $pdo->prepare(
        "SELECT id, unidade, periodo, objetivo, nome, telefone, email, status,
                DATE_FORMAT(criado_em, '%Y-%m-%dT%H:%i:%sZ') AS criado_em,
                DATE_FORMAT(status_em, '%Y-%m-%dT%H:%i:%sZ') AS status_em
           FROM leads $where
          ORDER BY criado_em DESC, id DESC
          LIMIT " . LEAD_EXPORTAR_MAX
    );
    $st->execute($args);
    return array_map(function (array $l): array {
        $l['id'] = (int) $l['id'];
        return $l;
    }, $st->fetchAll());
}

// id do JSON: so inteiro positivo de verdade (nada de "3 OR 1=1").
function id_valido(mixed $v): ?int
{
    return is_int($v) && $v > 0 && $v <= 4_294_967_295 ? $v : null;
}

// Resumo SEM dado pessoal: por mes (horario de Brasilia), quantos chegaram
// e em que status estao hoje. Os meses vao ate o limite da retencao (o que
// e mais velho ja foi apagado).
//
// O mes e calculado no PHP, com o fuso America/Sao_Paulo: o PHP traz a
// propria tabela de fusos (a do MySQL a Hostinger pode nao ter), e se o
// horario de verao voltar, a conta continua certa. Antes era "-3 h" fixo
// no SQL. Volume pequeno: no maximo LEAD_RETENCAO_MESES de leads.
function resumo_leads(PDO $pdo, ?string $unidade): array
{
    $where = $unidade !== null ? 'WHERE unidade = ?' : '';
    $st = $pdo->prepare(
        "SELECT DATE_FORMAT(criado_em, '%Y-%m-%d %H:%i:%s') AS criado_em, status
           FROM leads $where"
    );
    $st->execute($unidade !== null ? [$unidade] : []);

    $utc = new DateTimeZone('UTC');
    $brasilia = new DateTimeZone('America/Sao_Paulo');
    $vazio = ['recebidos' => 0, 'novos' => 0, 'contatados' => 0, 'matricularam' => 0, 'descartados' => 0];
    $coluna = ['novo' => 'novos', 'contatado' => 'contatados', 'matriculou' => 'matricularam', 'descartado' => 'descartados'];
    $meses = [];
    foreach ($st->fetchAll() as $l) {
        // A conexao usa time_zone +00:00 (db.php): criado_em vem em UTC.
        $mes = (new DateTimeImmutable($l['criado_em'], $utc))->setTimezone($brasilia)->format('Y-m');
        $meses[$mes] ??= ['mes' => $mes] + $vazio;
        $meses[$mes]['recebidos']++;
        if (isset($coluna[$l['status']])) {
            $meses[$mes][$coluna[$l['status']]]++;
        }
    }
    krsort($meses);
    return array_values($meses);
}

// Apaga os leads mais velhos que a retencao, em lotes (nao trava a tabela
// se um dia tiver muita coisa). Devolve quantos apagou.
// $simular = true so conta, nao apaga.
function apagar_leads_vencidos(PDO $pdo, bool $simular = false): int
{
    $corte = 'criado_em < (UTC_TIMESTAMP() - INTERVAL ' . LEAD_RETENCAO_MESES . ' MONTH)';
    // (LEAD_RETENCAO_MESES e uma constante do codigo, nunca vem de fora.)
    if ($simular) {
        return (int) $pdo->query("SELECT COUNT(*) FROM leads WHERE $corte")->fetchColumn();
    }
    $total = 0;
    do {
        $n = $pdo->exec("DELETE FROM leads WHERE $corte ORDER BY criado_em LIMIT 1000");
        $total += (int) $n;
    } while ($n === 1000);
    return $total;
}
