<?php
declare(strict_types=1);

// Gera um .sql LEGIVEL de um backup, so pra olhar (nao mexe no banco).
//   php bin/abrir-backup.php backups/2026-10-15_0630.a24bak
// -> backups/2026-10-15_0630.sql
//
// O .sql tem dados pessoais SEM criptografia: apague quando terminar.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../src/backup.php';

$arquivo = $argv[1] ?? '';
if ($arquivo === '' || !is_file($arquivo)) {
    fwrite(STDERR, "Uso: php bin/abrir-backup.php backups/AAAA-MM-DD_HHMM.a24bak\n");
    exit(1);
}

try {
    $dados = backup_abrir((string) file_get_contents($arquivo), ler_escondido('Chave do backup: '));
} catch (Throwable $e) {
    fwrite(STDERR, 'Nao abriu: ' . $e->getMessage() . "\n");
    exit(1);
}

function valor_sql(mixed $v, bool $binario): string
{
    if ($v === null) {
        return 'NULL';
    }
    if (is_int($v) || is_float($v)) {
        return (string) $v;
    }
    if ($binario) {
        return "X'" . bin2hex((string) base64_decode($v, true)) . "'";
    }
    return "'" . strtr((string) $v, ['\\' => '\\\\', "'" => "\\'", "\n" => '\\n', "\r" => '\\r', "\0" => '\\0']) . "'";
}

$sql = "-- Backup de {$dados['criado_em']} (UTC). SO OS DADOS: as tabelas vem das migrations.\n"
    . '-- Migrations: ' . implode(', ', $dados['migrations']) . "\n"
    . "-- TEM DADOS PESSOAIS. Apague este arquivo quando terminar.\n\n"
    // Datas estao em UTC (como o site grava): sem isto, importar no
    // phpMyAdmin/terminal deslocaria os horarios pelo fuso do servidor.
    . "SET NAMES utf8mb4;\nSET time_zone = '+00:00';\nSET FOREIGN_KEY_CHECKS = 0;\n\n";
foreach ($dados['tabelas'] as $tabela => $t) {
    $sql .= "-- {$tabela}: " . count($t['linhas']) . " linha(s)\n";
    $cols = implode(', ', array_map(fn($c) => "`{$c}`", $t['colunas']));
    foreach ($t['linhas'] as $linha) {
        $vals = [];
        foreach ($t['colunas'] as $i => $col) {
            $vals[] = valor_sql($linha[$i], in_array($col, $t['binarias'], true));
        }
        $sql .= "INSERT INTO `{$tabela}` ({$cols}) VALUES (" . implode(', ', $vals) . ");\n";
    }
    $sql .= "\n";
}

$sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";

$saida = preg_replace('/\.a24bak$/', '', $arquivo) . '.sql';
file_put_contents($saida, $sql);
chmod($saida, 0600);
echo "Gerado: {$saida}\nTem dados pessoais sem criptografia: apague quando terminar.\n";
