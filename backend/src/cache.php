<?php
declare(strict_types=1);

// Cache simples em arquivo, em backend/cache/ (fora do public_html).
// So guarda coisa PUBLICA -- nunca dado de usuario ou de sessao.

function pasta_cache(): string
{
    $pasta = dirname(__DIR__) . '/cache';
    if (!is_dir($pasta)) {
        mkdir($pasta, 0750, true);
    }
    return $pasta;
}

// $nome e sempre fixo no codigo (ex.: 'grades'), nunca vem do visitante.
function cache_ler(string $nome, int $segundos): ?string
{
    $arquivo = pasta_cache() . "/{$nome}.json";
    if (!is_file($arquivo) || filemtime($arquivo) < time() - $segundos) {
        return null;
    }
    $conteudo = file_get_contents($arquivo);
    return $conteudo === false ? null : $conteudo;
}

function cache_gravar(string $nome, string $conteudo): void
{
    // Grava num temporario e renomeia: quem estiver lendo nunca pega o
    // arquivo pela metade.
    $arquivo = pasta_cache() . "/{$nome}.json";
    $tmp = $arquivo . '.' . bin2hex(random_bytes(4)) . '.tmp';
    file_put_contents($tmp, $conteudo, LOCK_EX);
    rename($tmp, $arquivo);
}

function cache_limpar(string $nome): void
{
    $arquivo = pasta_cache() . "/{$nome}.json";
    if (is_file($arquivo)) {
        unlink($arquivo);
    }
}
