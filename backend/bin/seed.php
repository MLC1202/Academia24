<?php
declare(strict_types=1);

// Coloca a grade de EXEMPLO no banco, pra desenvolver. So roda em dev.
//
//   docker compose exec php php bin/seed.php
//
// Cada vez que roda cria uma versao nova da grade de cada unidade (as
// antigas ficam guardadas, igual vai ser com o upload de verdade).
// Os dados vem de sql/seeds/grade-exemplo.json (copia do grade.ts do front).

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../src/config.php';
require __DIR__ . '/../src/db.php';
require __DIR__ . '/../src/log.php';
require __DIR__ . '/../src/grade.php';

if (em_producao()) {
    fwrite(STDERR, "Seed e so pra desenvolvimento (APP_ENV=prod).\n");
    exit(1);
}

$arquivo = dirname(__DIR__) . '/sql/seeds/grade-exemplo.json';
$grades = json_decode(file_get_contents($arquivo), true, 10, JSON_THROW_ON_ERROR);

// Usuario da aplicacao (menor privilegio): o seed so insere linhas.
$pdo = db();

foreach ($grades as $unidade => $aulas) {
    $versao = salvar_nova_versao($pdo, (string) $unidade, $aulas, 'seed', null);
    echo str_pad((string) $unidade, 12) . count($aulas) . " aulas -> versao {$versao}\n";
}

registrar('info', 'seed_grade', ['unidades' => array_keys($grades)]);
echo "Pronto.\n";
