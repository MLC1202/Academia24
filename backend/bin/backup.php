<?php
declare(strict_types=1);

// Backup do dia: banco inteiro -> backups/AAAA-MM-DD_HHMM.a24bak, trancado
// com o cadeado (APP_BACKUP_CADEADO). Apaga os com mais de 30 dias.
// Roda sozinho pelo Cron da Hostinger, 1x por dia (depois da limpeza dos
// leads). Local: docker compose exec php php bin/backup.php
//
// O log guarda so o nome do arquivo e o tamanho, nunca o conteudo.
// A pasta backups/ fica FORA do public_html e no .gitignore.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../src/config.php';
require __DIR__ . '/../src/db.php';
require __DIR__ . '/../src/log.php';
require __DIR__ . '/../src/backup.php';

try {
    $dados = backup_montar(db());
    $conteudo = backup_trancar($dados, config('APP_BACKUP_CADEADO'));
    $pasta = backup_pasta();
    $nome = gmdate('Y-m-d_Hi') . '.a24bak';
    backup_gravar("{$pasta}/{$nome}", $conteudo);
    $apagados = backup_faxina($pasta);
} catch (Throwable $e) {
    registrar('erro', 'backup_falhou', ['msg' => $e->getMessage()]);
    fwrite(STDERR, 'Backup FALHOU: ' . $e->getMessage() . "\n");
    exit(1);
}

$linhas = array_sum(array_map(fn($t) => count($t['linhas']), $dados['tabelas']));
registrar('info', 'backup_ok', [
    'arquivo' => $nome,
    'bytes' => strlen($conteudo),
    'linhas' => $linhas,
    'antigos_apagados' => $apagados,
]);
echo "Backup ok: backups/{$nome} (" . strlen($conteudo) . " bytes, {$linhas} linhas). Antigos apagados: {$apagados}.\n";
