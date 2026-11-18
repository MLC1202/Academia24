<?php
declare(strict_types=1);

// Teste da validacao da nota do Google (sem rede, sem banco).
//   docker run --rm -v "$PWD":/app -w /app php:8.3-cli php tests/avaliacoes.php

require __DIR__ . '/../src/avaliacoes.php';

function conferir(bool $ok, string $o_que): void
{
    echo ($ok ? 'ok   ' : 'FALHA ') . $o_que . PHP_EOL;
    if (!$ok) {
        exit(1);
    }
}

conferir(ler_nota(4.6) === 4.6, 'aceita 4.6');
conferir(ler_nota('4,6') === 4.6, 'aceita "4,6" (virgula)');
conferir(ler_nota(5) === 5.0, 'aceita 5 inteiro');
conferir(ler_nota(1.0) === 1.0, 'aceita o minimo');
conferir(ler_nota(4.55) === null, 'recusa duas casas decimais');
conferir(ler_nota(5.1) === null, 'recusa acima de 5');
conferir(ler_nota(0.9) === null, 'recusa abaixo de 1');
conferir(ler_nota('abc') === null, 'recusa texto');
conferir(ler_nota(null) === null, 'recusa vazio');
