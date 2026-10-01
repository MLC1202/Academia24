<?php
declare(strict_types=1);

// "Mantenha-me conectado neste aparelho" (aparelho confiavel pro MFA).
//
// Decidido com o Matheus em 01/10/2026: marcou a caixinha no login, por
// 30 dias aquele navegador NAO pede o codigo de 6 digitos. A SENHA continua
// sendo pedida sempre, e a sessao continua com 30 min parada / 8 h no total.
// Roubar so a senha nao basta: de outro aparelho o codigo e pedido.
//
// Cookie a24_aparelho = "seletor.validador" (base64url, aleatorios).
//   - seletor (12 bytes): acha a linha no banco
//   - validador (32 bytes): o banco guarda so o SHA-256 dele
//   - HttpOnly + SameSite=Strict + Secure (prod) + path /api/
//   - a cada uso o validador e trocado (cookie copiado e usado depois do
//     dono = validador velho = a linha e apagada e o codigo volta a ser pedido)
//   - prazo FIXO de 30 dias a partir de quando marcou (usar nao estica)
// Tudo da conta e apagado quando a senha muda ou o MFA liga/desliga
// (bin/admin.php e bin/mfa.php).

const APARELHO_COOKIE = 'a24_aparelho';
const APARELHO_DIAS = 30;
const APARELHO_MAX_POR_CONTA = 5; // o 6o aparelho derruba o mais antigo

function b64url(string $bytes): string
{
    return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
}

function b64url_ler(string $texto): string|false
{
    return base64_decode(strtr($texto, '-_', '+/'), true);
}

function aparelho_gravar_cookie(string $valor, int $expiraUnix): void
{
    setcookie(APARELHO_COOKIE, $valor, [
        'expires' => $expiraUnix,
        'path' => '/api/',          // so a API recebe; o resto do site nao
        'secure' => em_producao(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function aparelho_apagar_cookie(): void
{
    if (isset($_COOKIE[APARELHO_COOKIE])) {
        aparelho_gravar_cookie('', time() - 3600);
    }
}

// Chamado depois que o codigo do MFA foi aceito e a pessoa marcou a caixinha.
function aparelho_lembrar(PDO $pdo, int $adminId): void
{
    $seletor = random_bytes(12);
    $validador = random_bytes(32);

    $pdo->prepare(
        'INSERT INTO dispositivos_confiaveis
            (admin_id, seletor, validador_hash, criado_em, expira_em)
         VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP() + INTERVAL ' . APARELHO_DIAS . ' DAY)'
    )->execute([$adminId, $seletor, hash('sha256', $validador, true)]);
    $id = (int) $pdo->lastInsertId();

    // Faxina da conta: vencidos saem; passou de 5, o mais antigo sai.
    $pdo->prepare('DELETE FROM dispositivos_confiaveis WHERE admin_id = ? AND expira_em <= UTC_TIMESTAMP()')
        ->execute([$adminId]);
    $st = $pdo->prepare('SELECT id FROM dispositivos_confiaveis WHERE admin_id = ? ORDER BY id DESC');
    $st->execute([$adminId]);
    $sobra = array_slice($st->fetchAll(PDO::FETCH_COLUMN), APARELHO_MAX_POR_CONTA);
    $del = $pdo->prepare('DELETE FROM dispositivos_confiaveis WHERE id = ?');
    foreach ($sobra as $velho) {
        $del->execute([$velho]);
    }

    aparelho_gravar_cookie(b64url($seletor) . '.' . b64url($validador), time() + APARELHO_DIAS * 86400);
    registrar('info', 'aparelho_lembrado', ['admin_id' => $adminId, 'aparelho' => $id]);
}

// Chamado SO depois que a senha foi aceita. true = este navegador e um
// aparelho confiavel DESTA conta e pode pular o codigo.
function aparelho_confere(PDO $pdo, int $adminId): bool
{
    $cookie = $_COOKIE[APARELHO_COOKIE] ?? null;
    if (!is_string($cookie)) {
        return false;
    }
    // 12 bytes = 16 caracteres; 32 bytes = 43 caracteres.
    if (preg_match('/^([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]{43})$/', $cookie, $m) !== 1) {
        aparelho_apagar_cookie();
        return false;
    }
    $seletor = b64url_ler($m[1]);
    $validador = b64url_ler($m[2]);
    if ($seletor === false || $validador === false) {
        aparelho_apagar_cookie();
        return false;
    }

    $st = $pdo->prepare(
        'SELECT id, admin_id, validador_hash, UNIX_TIMESTAMP(expira_em) AS expira,
                expira_em > UTC_TIMESTAMP() AS valido
           FROM dispositivos_confiaveis WHERE seletor = ?'
    );
    $st->execute([$seletor]);
    $linha = $st->fetch();

    if (!$linha) {
        aparelho_apagar_cookie(); // foi esquecido (senha trocada, venceu...)
        return false;
    }
    if ((int) $linha['admin_id'] !== $adminId) {
        return false; // aparelho de OUTRA conta: so nao vale pra esta
    }
    $apagar = $pdo->prepare('DELETE FROM dispositivos_confiaveis WHERE id = ?');
    if (!hash_equals($linha['validador_hash'], hash('sha256', $validador, true))) {
        // Seletor certo com validador velho/errado: copia do cookie usada
        // depois do dono (ou adulterada). Corta o aparelho.
        $apagar->execute([$linha['id']]);
        aparelho_apagar_cookie();
        registrar('aviso', 'aparelho_suspeito', ['admin_id' => $adminId, 'aparelho' => (int) $linha['id']]);
        return false;
    }
    if (!(int) $linha['valido']) {
        $apagar->execute([$linha['id']]);
        aparelho_apagar_cookie();
        return false;
    }

    // Valeu: troca o validador (o cookie antigo deixa de servir).
    $novo = random_bytes(32);
    $pdo->prepare(
        'UPDATE dispositivos_confiaveis SET validador_hash = ?, ultimo_uso_em = UTC_TIMESTAMP() WHERE id = ?'
    )->execute([hash('sha256', $novo, true), $linha['id']]);
    aparelho_gravar_cookie($m[1] . '.' . b64url($novo), (int) $linha['expira']);
    return true;
}

// Senha trocada / MFA ligado ou desligado: todos os aparelhos da conta
// voltam a pedir o codigo. Devolve quantos foram esquecidos.
function aparelho_esquecer_todos(PDO $pdo, int $adminId): int
{
    $st = $pdo->prepare('DELETE FROM dispositivos_confiaveis WHERE admin_id = ?');
    $st->execute([$adminId]);
    return $st->rowCount();
}
