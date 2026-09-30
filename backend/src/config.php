<?php
declare(strict_types=1);

// Le o .env que fica em backend/ (na Hostinger: um nivel acima do
// public_html). Sem biblioteca: e so CHAVE=valor por linha.

function config(string $chave): string
{
    static $valores = null;

    if ($valores === null) {
        $arquivo = dirname(__DIR__) . '/.env';
        if (!is_readable($arquivo)) {
            throw new RuntimeException('.env nao encontrado');
        }

        $valores = [];
        foreach (file($arquivo, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linha) {
            $linha = trim($linha);
            if ($linha === '' || $linha[0] === '#' || !str_contains($linha, '=')) {
                continue;
            }
            [$nome, $valor] = explode('=', $linha, 2);
            $valores[trim($nome)] = trim(trim($valor), "\"'");
        }
    }

    if (!isset($valores[$chave]) || $valores[$chave] === '') {
        // So o nome da chave, nunca o valor.
        throw new RuntimeException("config ausente: {$chave}");
    }
    return $valores[$chave];
}

function em_producao(): bool
{
    return config('APP_ENV') === 'prod';
}
