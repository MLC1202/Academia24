<?php
declare(strict_types=1);

// Nota do Google de cada unidade, digitada no painel (tabela avaliacoes_google).

const NOTA_MIN = 1.0;
const NOTA_MAX = 5.0;

// { slug: 4.5, ... }
function notas_publicas(PDO $pdo): array
{
    $notas = [];
    foreach ($pdo->query('SELECT unidade, nota FROM avaliacoes_google') as $linha) {
        $notas[$linha['unidade']] = (float) $linha['nota'];
    }
    return $notas;
}

// Aceita 4.5 ou 4,5 (como o JSON manda numero, string so se vier do campo
// de texto). Uma casa decimal, entre 1,0 e 5,0. null se invalida.
function ler_nota(mixed $v): ?float
{
    if (is_string($v) && preg_match('/^\d(?:[.,]\d)?$/', trim($v)) === 1) {
        $v = (float) str_replace(',', '.', trim($v));
    }
    if (!is_int($v) && !is_float($v)) {
        return null;
    }
    $nota = round((float) $v, 1);
    return $nota >= NOTA_MIN && $nota <= NOTA_MAX && abs($nota - $v) < 0.0001 ? $nota : null;
}
