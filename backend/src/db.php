<?php
declare(strict_types=1);

// Conexao com o banco. Regra do projeto: SO prepared statements.
//   certo:  $st = db()->prepare('SELECT * FROM aulas WHERE versao_id = ?');
//           $st->execute([$id]);
//   errado: db()->query("SELECT * FROM aulas WHERE versao_id = $id");

function conectar(string $usuario, string $senha): PDO
{
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        config('DB_HOST'),
        config('DB_PORT'),
        config('DB_NAME'),
    );

    $pdo = new PDO($dsn, $usuario, $senha, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        // Prepared statement de verdade no servidor, nao "simulado" pelo PHP.
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_STRINGIFY_FETCHES => false,
    ]);

    // Datas gravadas em UTC; o front converte pra exibir.
    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}

// Conexao da aplicacao (usuario com menor privilegio). Uma por requisicao.
function db(): PDO
{
    static $pdo = null;
    return $pdo ??= conectar(config('DB_USER'), config('DB_PASS'));
}
