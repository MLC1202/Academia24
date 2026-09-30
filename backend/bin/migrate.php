<?php
declare(strict_types=1);

// Migrations: muda o banco por arquivos numerados, sempre com o "desfazer".
//
//   php bin/migrate.php status   o que ja rodou e o que falta
//   php bin/migrate.php up       aplica todas as pendentes, em ordem
//   php bin/migrate.php down     desfaz SO a ultima aplicada
//
// Arquivos: sql/migrations/NNN_nome.up.sql e NNN_nome.down.sql
// Atencao: no MySQL/MariaDB, CREATE/ALTER/DROP nao entram em transacao.
// Se uma migration quebrar no meio, rode o .down dela antes de tentar de novo.
// Nao use ';' dentro de textos no SQL (o script separa os comandos por ele).

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../src/config.php';
require __DIR__ . '/../src/db.php';

$pasta = dirname(__DIR__) . '/sql/migrations';
$comando = $argv[1] ?? 'status';

// Usuario com permissao de mudar tabela. A aplicacao nunca usa este.
$pdo = conectar(config('DB_MIGRA_USER'), config('DB_MIGRA_PASS'));

$pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (
    versao VARCHAR(100) NOT NULL PRIMARY KEY,
    aplicada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

$aplicadas = $pdo->query('SELECT versao FROM schema_migrations ORDER BY versao')
    ->fetchAll(PDO::FETCH_COLUMN);

$todas = array_map(
    fn($f) => basename($f, '.up.sql'),
    glob("$pasta/*.up.sql") ?: [],
);
sort($todas);

function rodar_arquivo(PDO $pdo, string $arquivo): void
{
    $sql = file_get_contents($arquivo);
    // Tira comentarios de linha e separa por ';' no fim da linha.
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);
    foreach (preg_split('/;\s*$/m', $sql) as $comando) {
        if (trim($comando) !== '') {
            $pdo->exec($comando);
        }
    }
}

switch ($comando) {
    case 'status':
        foreach ($todas as $v) {
            echo (in_array($v, $aplicadas, true) ? '[x] ' : '[ ] ') . $v . PHP_EOL;
        }
        break;

    case 'up':
        $pendentes = array_diff($todas, $aplicadas);
        if (!$pendentes) {
            echo "Nada pendente.\n";
        }
        foreach ($pendentes as $v) {
            echo "aplicando $v ... ";
            rodar_arquivo($pdo, "$pasta/$v.up.sql");
            $pdo->prepare('INSERT INTO schema_migrations (versao) VALUES (?)')->execute([$v]);
            echo "ok\n";
        }
        break;

    case 'down':
        $ultima = end($aplicadas);
        if (!$ultima) {
            echo "Nada para desfazer.\n";
            break;
        }
        $down = "$pasta/$ultima.down.sql";
        if (!is_file($down)) {
            fwrite(STDERR, "Sem arquivo de rollback: $down\n");
            exit(1);
        }
        echo "desfazendo $ultima ... ";
        rodar_arquivo($pdo, $down);
        $pdo->prepare('DELETE FROM schema_migrations WHERE versao = ?')->execute([$ultima]);
        echo "ok\n";
        break;

    default:
        fwrite(STDERR, "Uso: php bin/migrate.php status|up|down\n");
        exit(1);
}
