<?php
declare(strict_types=1);

// MFA por TOTP: o mesmo codigo de 6 digitos que muda a cada 30 s no Google
// Authenticator / Microsoft Authenticator / 1Password.
//
// Como funciona: na ativacao, servidor e celular combinam um SEGREDO.
// A cada 30 s os dois calculam HMAC(segredo, relogio) e tiram 6 digitos.
// Se o numero bate, quem digitou tem o celular. Nada passa pela internet
// alem do codigo, e o codigo morre em 30 s.
//
// O segredo fica CRIPTOGRAFADO no banco (sodium, chave APP_CHAVE_MFA do
// .env). Quem roubar so o banco nao consegue gerar codigos.

const TOTP_PASSO_SEG = 30;
const TOTP_DIGITOS = 6;

// --- Base32 (formato que os apps de autenticacao usam pra chave) ------------

function base32_codificar(string $bytes): string
{
    $alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';
    foreach (str_split($bytes) as $c) {
        $bits .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
    }
    $saida = '';
    foreach (str_split($bits, 5) as $grupo) {
        $saida .= $alfabeto[bindec(str_pad($grupo, 5, '0'))];
    }
    return $saida;
}

// --- TOTP (RFC 6238) ----------------------------------------------------------

function totp_codigo(string $segredo, int $passo): string
{
    $contador = pack('J', $passo); // 8 bytes, big-endian
    $hash = hash_hmac('sha1', $contador, $segredo, true);
    $inicio = ord($hash[19]) & 0x0f;
    $numero = unpack('N', substr($hash, $inicio, 4))[1] & 0x7fffffff;
    return str_pad((string) ($numero % (10 ** TOTP_DIGITOS)), TOTP_DIGITOS, '0', STR_PAD_LEFT);
}

// Aceita o codigo do passo atual e de 1 passo antes/depois (relogio do
// celular um pouco adiantado/atrasado). Recusa passo <= $ultimoUsado
// (codigo repetido). Devolve o passo que bateu, ou null.
function totp_verificar(string $segredo, string $codigo, ?int $ultimoUsado, ?int $agora = null): ?int
{
    if (!preg_match('/^\d{6}$/', $codigo)) {
        return null;
    }
    $atual = intdiv($agora ?? time(), TOTP_PASSO_SEG);
    foreach ([$atual - 1, $atual, $atual + 1] as $passo) {
        if ($ultimoUsado !== null && $passo <= $ultimoUsado) {
            continue;
        }
        if (hash_equals(totp_codigo($segredo, $passo), $codigo)) {
            return $passo;
        }
    }
    return null;
}

// --- Segredo criptografado ----------------------------------------------------

function chave_mfa(): string
{
    $chave = hex2bin(config('APP_CHAVE_MFA'));
    if ($chave === false || strlen($chave) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) {
        throw new RuntimeException('APP_CHAVE_MFA precisa ter 64 caracteres hex');
    }
    return $chave;
}

function mfa_cifrar(string $segredo): string
{
    $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    return $nonce . sodium_crypto_secretbox($segredo, $nonce, chave_mfa());
}

function mfa_decifrar(string $guardado): string
{
    $nonce = substr($guardado, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    $cifra = substr($guardado, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    $segredo = sodium_crypto_secretbox_open($cifra, $nonce, chave_mfa());
    if ($segredo === false) {
        throw new RuntimeException('segredo MFA nao abriu (chave errada ou dado corrompido)');
    }
    return $segredo;
}
