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

// Problema que isto resolve (corrida): um visitante le a grade do banco,
// a dona salva (o cache e apagado), e so DEPOIS o visitante grava o JSON
// que leu -- velho. Ficaria no ar ate o cache vencer.
// Solucao: cada cache_limpar() aumenta um numero de "geracao". Quem vai
// gravar anota a geracao ANTES de ler o banco e so grava se ela nao mudou.
// Limpar e gravar passam pela mesma trava (flock), entao nao ha brecha
// entre conferir e gravar.

function cache_geracao(string $nome): int
{
    $arquivo = pasta_cache() . "/{$nome}.geracao";
    return is_file($arquivo) ? (int) file_get_contents($arquivo) : 0;
}

// Roda $acao com a trava exclusiva do cache $nome.
function cache_travado(string $nome, callable $acao): void
{
    $trava = fopen(pasta_cache() . "/{$nome}.lock", 'c');
    if ($trava === false || !flock($trava, LOCK_EX)) {
        throw new RuntimeException("cache {$nome}: nao consegui travar");
    }
    try {
        $acao();
    } finally {
        flock($trava, LOCK_UN);
        fclose($trava);
    }
}

// $geracao = o cache_geracao() lido ANTES de buscar os dados no banco.
function cache_gravar(string $nome, string $conteudo, int $geracao): void
{
    cache_travado($nome, function () use ($nome, $conteudo, $geracao) {
        if (cache_geracao($nome) !== $geracao) {
            return; // alguem mudou os dados no meio: o que eu li ja e velho
        }
        // Grava num temporario e renomeia: quem estiver lendo nunca pega o
        // arquivo pela metade.
        $arquivo = pasta_cache() . "/{$nome}.json";
        $tmp = $arquivo . '.' . bin2hex(random_bytes(4)) . '.tmp';
        file_put_contents($tmp, $conteudo, LOCK_EX);
        rename($tmp, $arquivo);
    });
}

function cache_limpar(string $nome): void
{
    cache_travado($nome, function () use ($nome) {
        $arquivo = pasta_cache() . "/{$nome}.json";
        if (is_file($arquivo)) {
            unlink($arquivo);
        }
        file_put_contents(pasta_cache() . "/{$nome}.geracao", (string) (cache_geracao($nome) + 1));
    });
}
