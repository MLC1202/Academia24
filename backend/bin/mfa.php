<?php
declare(strict_types=1);

// Liga ou desliga a verificacao em duas etapas (MFA) de uma conta.
// SO pelo terminal. Tambem e o caminho de recuperacao: se a dona perder o
// celular, desliga aqui e liga de novo no celular novo.
//
//   docker compose exec php php bin/mfa.php

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../src/config.php';
require __DIR__ . '/../src/db.php';
require __DIR__ . '/../src/log.php';
require __DIR__ . '/../src/mfa.php';

function perguntar(string $texto): string
{
    echo $texto;
    return trim((string) fgets(STDIN));
}

function sair(string $msg): never
{
    fwrite(STDERR, $msg . PHP_EOL);
    exit(1);
}

chave_mfa(); // ja falha aqui se o .env nao tiver APP_CHAVE_MFA

$email = mb_strtolower(perguntar('E-mail da conta: '));
$st = db()->prepare('SELECT id, mfa_segredo FROM admins WHERE email = ?');
$st->execute([$email]);
$admin = $st->fetch();
if (!$admin) {
    sair('Conta nao encontrada.');
}
$id = (int) $admin['id'];

if ($admin['mfa_segredo'] !== null) {
    $r = mb_strtolower(perguntar("O MFA dessa conta esta LIGADO.\nDesligar (ex.: celular perdido)? (s/n) "));
    if ($r !== 's') {
        sair('Nada foi alterado.');
    }
    db()->prepare('UPDATE admins SET mfa_segredo = NULL, mfa_ultimo_passo = NULL WHERE id = ?')
        ->execute([$id]);
    registrar('aviso', 'mfa_desligado', ['admin_id' => $id]);
    echo "MFA desligado. Rode de novo para ligar no celular novo.\n";
    exit(0);
}

// 20 bytes aleatorios = 160 bits, o tamanho recomendado pra TOTP/SHA1.
$segredo = random_bytes(20);
$chave = base32_codificar($segredo);
$emissor = 'Rede 24';
$uri = sprintf(
    'otpauth://totp/%s:%s?secret=%s&issuer=%s&digits=6&period=30',
    rawurlencode($emissor),
    rawurlencode($email),
    $chave,
    rawurlencode($emissor),
);

echo "\n1. No celular, abra o Google Authenticator (ou Microsoft Authenticator).\n";
echo "2. Toque em + > \"Inserir chave de configuracao\".\n";
echo "   Nome: {$emissor}\n";
echo '   Chave: ' . implode(' ', str_split($chave, 4)) . "\n";
echo "   Tipo: baseado no tempo\n";
echo "\n   Sem digitar a chave: em OUTRA aba do Terminal do Mac rode\n";
echo "   open \"{$uri}\"\n";
echo "   (abre o app Senhas ja com o codigo configurado; sincroniza com o iPhone)\n\n";

// So grava depois de provar que o celular gera o codigo certo. Assim
// ninguem fica trancado pra fora por ter digitado a chave errada.
for ($tentativa = 1; $tentativa <= 3; $tentativa++) {
    $codigo = preg_replace('/\s+/', '', perguntar('3. Digite o codigo de 6 digitos que o app mostra: '));
    $passo = totp_verificar($segredo, $codigo, null);
    if ($passo !== null) {
        db()->prepare('UPDATE admins SET mfa_segredo = ?, mfa_ultimo_passo = ? WHERE id = ?')
            ->execute([mfa_cifrar($segredo), $passo, $id]);
        registrar('info', 'mfa_ligado', ['admin_id' => $id]);
        echo "MFA ligado. A partir de agora o login pede senha + codigo.\n";
        exit(0);
    }
    // Diagnostico: o codigo bate com algum horario ate 10 min pra tras/frente?
    // Se sim, o problema e relogio; se nao, a chave cadastrada e outra.
    $atual = intdiv(time(), TOTP_PASSO_SEG);
    $diferenca = null;
    for ($d = -20; $d <= 20 && $diferenca === null; $d++) {
        if (preg_match('/^\d{6}$/', $codigo) && hash_equals(totp_codigo($segredo, $atual + $d), $codigo)) {
            $diferenca = $d * TOTP_PASSO_SEG;
        }
    }
    if (!preg_match('/^\d{6}$/', $codigo)) {
        echo "Isso nao e um codigo: digite so os 6 NUMEROS do app (nao a senha da conta).\n";
    } elseif ($diferenca !== null) {
        echo "O codigo e de outro horario (~{$diferenca} s de diferenca): acerte o relogio do celular/computador.\n";
    } else {
        echo "Codigo nao confere com esta chave: a chave cadastrada no app esta diferente.\n";
        echo "Apague a entrada no app e cadastre de novo (ou use o comando 'open' acima).\n";
    }
}
sair('MFA NAO foi ligado.');
