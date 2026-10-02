<?php
declare(strict_types=1);

// Como as senhas sao guardadas (hash). Um lugar so pra bin/admin.php (cria e
// troca senha) e api/login.php (confere).
//
// Argon2id quando o PHP tem; senao bcrypt. Os parametros ficam FIXOS aqui,
// e nao no padrao do PHP (que muda de versao pra versao: o custo do bcrypt
// passou de 10 pra 12 no PHP 8.4). Assim a senha falsa abaixo leva o mesmo
// tempo que uma de verdade em qualquer servidor.

function senha_algoritmo(): array
{
    if (defined('PASSWORD_ARGON2ID')) {
        return [PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1]];
    }
    return [PASSWORD_BCRYPT, ['cost' => 12]];
}

function senha_hash(string $senha): string
{
    [$algoritmo, $opcoes] = senha_algoritmo();
    return password_hash($senha, $algoritmo, $opcoes);
}

// true = o hash foi feito com outro algoritmo/parametro (ex.: conta criada
// noutro PHP). O login.php refaz o hash na hora, com a senha em maos.
function senha_precisa_refazer(string $hash): bool
{
    [$algoritmo, $opcoes] = senha_algoritmo();
    return password_needs_rehash($hash, $algoritmo, $opcoes);
}

// Hash de uma senha aleatoria jogada fora (nenhuma senha bate), com os
// MESMOS parametros de cima. O login confere contra ele quando o e-mail nao
// existe: sem isso a resposta sairia mais rapido e daria pra descobrir quais
// e-mails tem conta so cronometrando.
function senha_hash_falso(): string
{
    return defined('PASSWORD_ARGON2ID')
        ? '$argon2id$v=19$m=65536,t=4,p=1$WURjS1RnTllyT0wuZzZ5Vw$yJtlzpchM3rG925XO+wjFStcMMGj1xwWREs4f/svSOk'
        : '$2y$12$su.O7FYLhVu7HHOpcv.MyeD0NQeS7flG7PSBa8RHghgjQXkLCq/1O';
}
