<?php
declare(strict_types=1);

// GET /api/avaliacoes.php
// Publico. { "alphaville": 4.5, "norte": 4.5, ... }: a nota do Google que a
// equipe digitou no painel. Tabela de 4 linhas, entao nao precisa de cache
// no servidor; o navegador guarda 5 min.

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/avaliacoes.php';

exigir_metodo('GET', 'HEAD');

header('Cache-Control: public, max-age=300');
responder(200, notas_publicas(db()));
