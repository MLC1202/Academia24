<?php
declare(strict_types=1);

// Vigia (item O2): le o log desde a ultima rodada e, se aparecer algo
// preocupante, manda UM e-mail pra dona (ALERTA_EMAIL_PARA no .env) pela
// caixa da Hostinger. So contagens e o que fazer -- nenhum dado de cliente.
// Roda pelo Cron da Hostinger a cada hora.
//
//   php bin/vigia.php            rodada normal (Cron)
//   php bin/vigia.php --simular  mostra o que mandaria, nao manda nada
//   php bin/vigia.php --teste    manda um e-mail de teste (confere o SMTP)
//
// Uma vez por dia (9h) confere tambem se o backup e a limpeza de leads
// rodaram nas ultimas 30 h (o Cron pode parar sem avisar ninguem).

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../src/config.php';
require __DIR__ . '/../src/log.php';
require __DIR__ . '/../src/email.php';

const FUSO = 'America/Sao_Paulo';
const HORA_CHECAGEM_DIARIA = 9;

// evento do log => [minimo pra avisar, frase (%d = quantas), o que fazer]
const REGRAS = [
    'excecao_nao_tratada' => [1, '%d erro(s) interno(s) no site', 'Alguns visitantes podem ter visto uma mensagem de erro. Avise o responsável técnico.'],
    'backup_falhou' => [1, 'o backup automático do banco falhou (%d vez(es))', 'Avise o responsável técnico: sem backup, dados podem se perder.'],
    'restauracao_falhou' => [1, '%d tentativa(s) de restaurar um backup que falhou', 'Se ninguém pediu isso, avise o responsável técnico imediatamente.'],
    'backup_restaurado' => [1, 'os dados do site foram restaurados de um backup (%d vez(es))', 'Se ninguém pediu isso, avise o responsável técnico imediatamente.'],
    'leads_retencao_falhou' => [1, 'a limpeza automática de leads com mais de 6 meses (LGPD) falhou', 'Avise o responsável técnico.'],
    'env_legivel_por_todos' => [1, 'o arquivo de senhas do servidor está com a permissão aberta', 'Avise o responsável técnico (precisa ficar com permissão 600).'],
    'mfa_bloqueado' => [1, '%d bloqueio(s) do código de verificação: alguém ACERTOU a senha do painel mas errou o código várias vezes', 'Se não foi você, sua senha pode ter vazado. Peça ao responsável técnico pra trocá-la.'],
    'aparelho_suspeito' => [1, '%d uso(s) suspeito(s) do "Mantenha-me conectado" (o aparelho foi desconectado por segurança)', 'Se você não reconhece, avise o responsável técnico.'],
    'login_bloqueado' => [1, '%d bloqueio(s) de login por excesso de tentativas', 'Alguém errou a senha do painel muitas vezes seguidas. Se não foi você, avise o responsável técnico.'],
    'login_falhou' => [10, '%d tentativas de login com senha errada no painel', 'Se não foi você, alguém pode estar tentando adivinhar a senha. O site já bloqueia depois de várias tentativas.'],
    'exportacao_bloqueada' => [1, '%d exportação(ões) de leads bloqueada(s) por excesso', 'Muitas exportações seguidas. Se não foi você, avise o responsável técnico.'],
    'lead_bloqueado' => [10, '%d envios do formulário de agendamento bloqueados (possível spam)', 'Se algum cliente disser que não conseguiu agendar, avise o responsável técnico.'],
];

// "Isto tem que ter rodado nas ultimas 30 h" (checado 1x por dia).
const ROTINAS = [
    'backup_ok' => 'o backup automático do banco NÃO rodou nas últimas 30 horas',
    'leads_retencao' => 'a limpeza automática de leads (LGPD) NÃO rodou nas últimas 30 horas',
];

$args = array_slice($argv, 1);
if (array_diff($args, ['--simular', '--teste'])) {
    fwrite(STDERR, "Uso: php bin/vigia.php [--simular | --teste]\n");
    exit(1);
}
$simular = in_array('--simular', $args, true);

$para = config_opcional('ALERTA_EMAIL_PARA');
if ($para === '' && !$simular) {
    registrar('aviso', 'alerta_sem_destino', []);
    fwrite(STDERR, "ALERTA_EMAIL_PARA vazio no .env: nenhum alerta e enviado.\n");
    exit(1);
}

function quando_br(int $ts): string
{
    return (new DateTimeImmutable('@' . $ts))->setTimezone(new DateTimeZone(FUSO))->format('d/m H:i');
}

if (in_array('--teste', $args, true)) {
    try {
        enviar_email($para, '[Site Rede 24] Teste do alerta', "Olá,\n\nEste é um teste do aviso automático do site da Rede 24.\nSe chegou, está tudo certo: quando o site precisar de atenção, o aviso chega neste e-mail.\n");
    } catch (Throwable $e) {
        registrar('erro', 'alerta_falhou', ['msg' => $e->getMessage()]);
        fwrite(STDERR, 'Teste FALHOU: ' . $e->getMessage() . "\n");
        exit(1);
    }
    registrar('info', 'alerta_teste_enviado', []);
    echo "E-mail de teste enviado.\n";
    exit(0);
}

// Ate o segundo ANTERIOR: um evento gravado neste mesmo segundo entra na
// proxima rodada (senao podia ficar de fora das duas).
$agora = time() - 1;
$arquivoUltimo = pasta_logs() . '/.vigia-ultimo';
$desde = is_file($arquivoUltimo) ? (int) file_get_contents($arquivoUltimo) : $agora - 3600;
$desde = max($desde, $agora - 7 * 86400); // parado ha dias: olha so a ultima semana

// Le os logs do periodo (mes atual e o anterior, por causa da virada).
$contagem = [];
$ultimaVez = [];
foreach ([gmdate('Y-m', $agora - 32 * 86400), gmdate('Y-m', $agora)] as $mes) {
    $arquivo = pasta_logs() . "/app-{$mes}.log";
    if (!is_readable($arquivo)) {
        continue;
    }
    foreach (file($arquivo, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linha) {
        $l = json_decode($linha, true);
        if (!is_array($l) || !isset($l['evento'], $l['quando'])) {
            continue;
        }
        $ts = strtotime((string) $l['quando']);
        if ($ts === false) {
            continue;
        }
        $ultimaVez[$l['evento']] = max($ultimaVez[$l['evento']] ?? 0, $ts);
        if ($ts > $desde && $ts <= $agora) {
            $contagem[$l['evento']] = ($contagem[$l['evento']] ?? 0) + 1;
        }
    }
}

$itens = [];
foreach (REGRAS as $evento => [$minimo, $frase, $fazer]) {
    $n = $contagem[$evento] ?? 0;
    if ($n >= $minimo) {
        $itens[] = '• ' . ucfirst(sprintf($frase, $n)) . ".\n  O que fazer: {$fazer}";
    }
}

// Checagem diaria das rotinas (na rodada das 9h, horario de Brasilia).
$horaBr = (int) (new DateTimeImmutable('@' . $agora))->setTimezone(new DateTimeZone(FUSO))->format('G');
if ($horaBr === HORA_CHECAGEM_DIARIA) {
    foreach (ROTINAS as $evento => $frase) {
        if (($ultimaVez[$evento] ?? 0) < $agora - 30 * 3600) {
            $itens[] = '• ' . ucfirst($frase) . ".\n  O que fazer: avise o responsável técnico (o agendamento automático pode ter parado).";
        }
    }
}

if (!$itens) {
    if (!$simular) {
        file_put_contents($arquivoUltimo, (string) $agora, LOCK_EX);
    }
    echo "Nada a avisar (" . quando_br($desde) . ' a ' . quando_br($agora) . ").\n";
    exit(0);
}

$assunto = '[Site Rede 24] Atenção: ' . count($itens) . (count($itens) === 1 ? ' aviso' : ' avisos');
$texto = "Olá,\n\nO site da Rede 24 registrou algo que merece atenção entre "
    . quando_br($desde) . ' e ' . quando_br($agora) . " (horário de Brasília):\n\n"
    . implode("\n\n", $itens)
    . "\n\n--\nAviso automático do site. Não contém dados de clientes.\n"
    . "Detalhes técnicos ficam no log do servidor (pasta logs/).\n";

if ($simular) {
    echo "Para: {$para}\nAssunto: {$assunto}\n\n{$texto}";
    exit(0);
}

try {
    enviar_email($para, $assunto, $texto);
} catch (Throwable $e) {
    // Nao avanca o "desde": na proxima hora tenta de novo com tudo junto.
    registrar('erro', 'alerta_falhou', ['msg' => $e->getMessage()]);
    fwrite(STDERR, 'Alerta NAO enviado: ' . $e->getMessage() . "\n");
    exit(1);
}
file_put_contents($arquivoUltimo, (string) $agora, LOCK_EX);
registrar('info', 'alerta_enviado', ['avisos' => count($itens)]);
echo "Alerta enviado ({$assunto}).\n";
