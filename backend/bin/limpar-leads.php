<?php
declare(strict_types=1);

// LGPD: apaga os leads com mais de 6 meses (LEAD_RETENCAO_MESES em
// src/leads.php). Roda sozinho todo dia pelo Cron Job da Hostinger.
//
//   php bin/limpar-leads.php            apaga e escreve quantos
//   php bin/limpar-leads.php --simular  so mostra quantos SERIAM apagados
//
// Local (Docker):
//   docker compose exec php php bin/limpar-leads.php --simular
//
// Hostinger (hPanel > Avancado > Cron Jobs), 1x por dia de madrugada:
//   /usr/bin/php /home/<usuario>/domains/<dominio>/bin/limpar-leads.php
// (o caminho exato aparece no hPanel; confira no deploy)
//
// Usa o usuario da aplicacao (DB_USER): ele so precisa de DELETE.
// O log guarda so QUANTOS foram apagados, nunca quem.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../src/config.php';
require __DIR__ . '/../src/db.php';
require __DIR__ . '/../src/log.php';
require __DIR__ . '/../src/leads.php';

$args = array_slice($argv, 1);
$simular = in_array('--simular', $args, true);
if (array_diff($args, ['--simular'])) {
    fwrite(STDERR, "Uso: php bin/limpar-leads.php [--simular]\n");
    exit(1);
}

try {
    $n = apagar_leads_vencidos(db(), $simular);
} catch (Throwable $e) {
    registrar('erro', 'leads_retencao_falhou', ['msg' => $e->getMessage()]);
    fwrite(STDERR, "Falhou: veja o log em backend/logs/.\n");
    exit(1);
}

if ($simular) {
    echo "Simulacao: $n lead(s) com mais de " . LEAD_RETENCAO_MESES . " meses seriam apagados.\n";
    exit(0);
}

registrar('info', 'leads_retencao', ['apagados' => $n, 'meses' => LEAD_RETENCAO_MESES]);
echo "$n lead(s) com mais de " . LEAD_RETENCAO_MESES . " meses apagados.\n";
