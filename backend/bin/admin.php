<?php
declare(strict_types=1);

// Cria a conta do dashboard ou troca a senha dela. SO pelo terminal:
// o site nao tem pagina de cadastro, entao ninguem de fora consegue criar
// uma conta de admin.
//
//   docker compose exec php php bin/admin.php
//
// Pede e-mail e senha (a senha nao aparece enquanto voce digita). Se o
// e-mail ja existir, pergunta se e pra trocar a senha.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../src/config.php';
require __DIR__ . '/../src/db.php';
require __DIR__ . '/../src/log.php';

const SENHA_MIN = 12;
const SENHA_MAX = 128;

function perguntar(string $texto): string
{
    echo $texto;
    return trim((string) fgets(STDIN));
}

// Le sem mostrar na tela (desliga o "eco" do terminal enquanto digita).
function perguntar_senha(string $texto): string
{
    echo $texto;
    $temTerminal = function_exists('posix_isatty') ? posix_isatty(STDIN) : true;
    if ($temTerminal) {
        shell_exec('stty -echo 2>/dev/null');
    }
    $valor = rtrim((string) fgets(STDIN), "\r\n");
    if ($temTerminal) {
        shell_exec('stty echo 2>/dev/null');
    }
    echo PHP_EOL;
    return $valor;
}

function sair(string $msg): never
{
    fwrite(STDERR, $msg . PHP_EOL);
    exit(1);
}

// --- e-mail ------------------------------------------------------------
$email = mb_strtolower(perguntar('E-mail: '));
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
    sair('E-mail invalido.');
}

$pdo = db();
$st = $pdo->prepare('SELECT id FROM admins WHERE email = ?');
$st->execute([$email]);
$existente = $st->fetchColumn();

if ($existente !== false) {
    $resp = mb_strtolower(perguntar('Esse e-mail ja tem conta. Trocar a senha? (s/n) '));
    if ($resp !== 's') {
        sair('Nada foi alterado.');
    }
}

// --- senha -------------------------------------------------------------
// Regra: comprimento importa mais que "simbolo obrigatorio". Uma frase
// longa e facil de lembrar e dificil de adivinhar.
echo 'Senha: minimo ' . SENHA_MIN . " caracteres (uma frase funciona bem).\n";
$senha = perguntar_senha('Senha: ');
$confirma = perguntar_senha('Repita a senha: ');

if (!hash_equals($senha, $confirma)) {
    sair('As senhas nao conferem.');
}
$tamanho = mb_strlen($senha);
if ($tamanho < SENHA_MIN || $tamanho > SENHA_MAX) {
    sair('A senha precisa ter entre ' . SENHA_MIN . ' e ' . SENHA_MAX . ' caracteres.');
}
if (mb_stripos($senha, explode('@', $email)[0]) !== false) {
    sair('A senha nao pode conter o proprio e-mail.');
}
if (count(array_unique(mb_str_split($senha))) < 5) {
    sair('A senha e repetitiva demais.');
}

// Argon2id: o algoritmo recomendado hoje. O hash ja inclui o "sal", entao
// duas pessoas com a mesma senha ficam com hashes diferentes.
$algoritmo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
$hash = password_hash($senha, $algoritmo);

if ($existente === false) {
    $pdo->prepare('INSERT INTO admins (email, senha_hash) VALUES (?, ?)')
        ->execute([$email, $hash]);
    $id = (int) $pdo->lastInsertId();
    registrar('info', 'admin_criado', ['admin_id' => $id]);
    echo "Conta criada (id {$id}).\n";
} else {
    $pdo->prepare('UPDATE admins SET senha_hash = ?, ativo = 1 WHERE id = ?')
        ->execute([$hash, $existente]);
    registrar('info', 'admin_senha_trocada', ['admin_id' => (int) $existente]);
    echo "Senha trocada.\n";
}
