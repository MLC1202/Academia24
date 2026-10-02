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

// Fail-closed: SO o valor exato "dev" relaxa as protecoes (MFA opcional,
// cookie sem Secure, sem HSTS, Origin localhost aceita). Qualquer outro
// valor ("prod", "production", erro de digitacao) conta como producao.
// Igual a config(), mas devolve '' em vez de erro quando a chave nao existe
// ou esta vazia (campo que pode ficar em branco, ex.: ALERTA_EMAIL_PARA).
function config_opcional(string $chave): string
{
    try {
        return config($chave);
    } catch (RuntimeException $e) {
        if (str_starts_with($e->getMessage(), 'config ausente')) {
            return '';
        }
        throw $e;
    }
}

function em_producao(): bool
{
    return config('APP_ENV') !== 'dev';
}

// Trava: "dev" so vale na maquina local. Se um .env de desenvolvimento for
// parar no servidor, o site da erro 500 em vez de abrir sem MFA.
// Olha o IP da CONEXAO (REMOTE_ADDR), que o visitante nao consegue
// falsificar: no Docker e um IP de rede interna; na Hostinger e o IP
// publico de quem acessa.
function exigir_dev_so_local(): void
{
    if (PHP_SAPI === 'cli' || em_producao()) {
        return;
    }
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $publico = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
    if ($publico) {
        throw new RuntimeException('APP_ENV=dev recebendo acesso de fora da maquina local');
    }
}
