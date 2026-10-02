<?php
declare(strict_types=1);

// Volta um backup pro banco. APAGA os dados atuais e coloca os do backup.
//   php bin/restaurar-backup.php backups/2026-10-15_0630.a24bak
//
// Pede a CHAVE (nao aparece na tela, nao fica salva) e uma confirmacao.
// Antes de apagar, faz um backup do estado atual ("antes-de-restaurar"):
// se restaurou o arquivo errado, da pra voltar.
// O banco precisa estar com as MESMAS migrations do backup (num servidor
// novo: rode bin/migrate.php up antes).

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../src/config.php';
require __DIR__ . '/../src/db.php';
require __DIR__ . '/../src/log.php';
require __DIR__ . '/../src/cache.php';
require __DIR__ . '/../src/backup.php';

function sair(string $msg): never
{
    fwrite(STDERR, $msg . PHP_EOL);
    exit(1);
}

$arquivo = $argv[1] ?? '';
if ($arquivo === '' || !is_file($arquivo)) {
    sair("Uso: php bin/restaurar-backup.php backups/AAAA-MM-DD_HHMM.a24bak");
}

try {
    $dados = backup_abrir((string) file_get_contents($arquivo), ler_escondido('Chave do backup: '));
} catch (Throwable $e) {
    sair('Nao abriu: ' . $e->getMessage());
}

$pdo = db();
if ($dados['migrations'] !== backup_migrations($pdo)) {
    sair("As tabelas deste banco nao batem com as do backup (migrations diferentes).\n"
        . 'Backup: ' . implode(', ', $dados['migrations']) . "\n"
        . 'Banco:  ' . implode(', ', backup_migrations($pdo)));
}
$estrutura = backup_estrutura($pdo);
foreach ($dados['tabelas'] as $tabela => $t) {
    if (($estrutura[$tabela]['colunas'] ?? null) !== $t['colunas']) {
        sair("Tabela {$tabela}: colunas diferentes das do banco. Nada foi alterado.");
    }
}

echo "\nBackup de {$dados['criado_em']} (UTC):\n";
foreach ($dados['tabelas'] as $tabela => $t) {
    echo '  ' . str_pad($tabela, 26) . count($t['linhas']) . " linha(s)\n";
}
echo "\nIsto APAGA os dados atuais do banco e coloca os do backup.\n";
echo 'Para continuar, digite RESTAURAR: ';
if (trim((string) fgets(STDIN)) !== 'RESTAURAR') {
    sair('Nada foi alterado.');
}

// Rede de seguranca: o estado atual vira um backup antes de apagar.
$antes = backup_pasta() . '/' . gmdate('Y-m-d_Hi') . '-antes-de-restaurar.a24bak';
backup_gravar($antes, backup_trancar(backup_montar($pdo), config('APP_BACKUP_CADEADO')));

// Tudo numa transacao: ou entra o backup inteiro, ou nada muda.
$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
$pdo->beginTransaction();
try {
    foreach (array_keys($estrutura) as $tabela) {
        $pdo->exec('DELETE FROM ' . backup_nome($tabela));
    }
    foreach ($dados['tabelas'] as $tabela => $t) {
        if (!$t['linhas']) {
            continue;
        }
        $cols = implode(', ', array_map('backup_nome', $t['colunas']));
        $marcas = implode(', ', array_fill(0, count($t['colunas']), '?'));
        $ins = $pdo->prepare('INSERT INTO ' . backup_nome($tabela) . " ({$cols}) VALUES ({$marcas})");
        foreach ($t['linhas'] as $linha) {
            foreach ($t['colunas'] as $i => $col) {
                if ($linha[$i] !== null && in_array($col, $t['binarias'], true)) {
                    $linha[$i] = base64_decode($linha[$i], true);
                }
            }
            $ins->execute($linha);
        }
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    registrar('erro', 'restauracao_falhou', ['arquivo' => basename($arquivo), 'msg' => $e->getMessage()]);
    sair('Restauracao FALHOU e foi desfeita (o banco ficou como estava): ' . $e->getMessage());
}
$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

cache_limpar('grades'); // o site mostra a grade restaurada na hora
registrar('aviso', 'backup_restaurado', ['arquivo' => basename($arquivo), 'de' => $dados['criado_em']]);
echo "\nRestaurado. O estado anterior ficou em backups/" . basename($antes) . "\n";
