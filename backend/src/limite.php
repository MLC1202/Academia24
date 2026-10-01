<?php
declare(strict_types=1);

// Rate limit: conta tentativas por acao + chave (IP ou e-mail) numa janela
// de tempo. Usado no login (e depois no formulario de lead e no upload).
//
// A chave nunca e gravada crua: vira um HMAC com APP_CHAVE_HMAC (.env).
// Assim a tabela nao guarda IP nem e-mail de ninguem (LGPD), mas o mesmo
// IP sempre gera o mesmo codigo, entao da pra contar.

function chave_limite(string $valor): string
{
    return hash_hmac('sha256', $valor, config('APP_CHAVE_HMAC'), true);
}

function tentativas_recentes(string $acao, string $valor, int $janelaSeg): int
{
    $st = db()->prepare(
        'SELECT COUNT(*) FROM tentativas
          WHERE acao = ? AND chave_hash = ?
            AND criado_em > (UTC_TIMESTAMP() - INTERVAL ? SECOND)'
    );
    $st->execute([$acao, chave_limite($valor), $janelaSeg]);
    return (int) $st->fetchColumn();
}

function registrar_tentativa(string $acao, string $valor): void
{
    db()->prepare('INSERT INTO tentativas (acao, chave_hash) VALUES (?, ?)')
        ->execute([$acao, chave_limite($valor)]);

    // De vez em quando (1 em 50) apaga o que tem mais de 1 dia.
    if (random_int(1, 50) === 1) {
        db()->exec('DELETE FROM tentativas WHERE criado_em < (UTC_TIMESTAMP() - INTERVAL 1 DAY)');
    }
}

function zerar_tentativas(string $acao, string $valor): void
{
    db()->prepare('DELETE FROM tentativas WHERE acao = ? AND chave_hash = ?')
        ->execute([$acao, chave_limite($valor)]);
}

// IP de quem chamou. So REMOTE_ADDR: o header X-Forwarded-For qualquer um
// inventa, entao nao serve pra bloquear ninguem.
function ip_cliente(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? 'desconhecido');
}

function bloquear_com_429(int $esperarSeg): never
{
    header('Retry-After: ' . $esperarSeg);
    responder(429, ['erro' => 'muitas_tentativas', 'tente_em_segundos' => $esperarSeg]);
}
