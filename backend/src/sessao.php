<?php
declare(strict_types=1);

// Sessao do admin (login), CSRF e expiracao.
//
// Como funciona: depois do login, o navegador guarda um cookie com um ID
// aleatorio. Os dados (quem esta logado, desde quando) ficam no SERVIDOR;
// o cookie e so a "senha do armario". Por isso o cookie e:
//   HttpOnly  -> JavaScript nao le (um script malicioso nao rouba)
//   Secure    -> so viaja em HTTPS (em producao)
//   SameSite  -> outro site nao consegue mandar o cookie junto

const SESSAO_OCIOSA_SEG = 30 * 60;     // 30 min sem usar -> sai
const SESSAO_ABSOLUTA_SEG = 8 * 3600;  // 8 h no total -> sai, mesmo usando
const MFA_PRAZO_SEG = 5 * 60;          // entre a senha e o codigo

function iniciar_sessao(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('a24_sessao');
    session_set_cookie_params([
        'lifetime' => 0,          // some quando fecha o navegador
        'path' => '/',
        'secure' => em_producao(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    ini_set('session.use_strict_mode', '1'); // nao aceita ID inventado
    ini_set('session.use_only_cookies', '1');
    // A "faxina" do PHP apaga sessao parada ha mais de 24 min (padrao). Aqui
    // ela passa a esperar os mesmos 30 min da regra abaixo -- vale no Docker
    // e na Hostinger sem depender do painel.
    ini_set('session.gc_maxlifetime', (string) SESSAO_OCIOSA_SEG);
    session_start();

    // Expiracao: confere a cada requisicao.
    if (isset($_SESSION['admin_id'])) {
        $agora = time();
        $ociosa = $agora - ($_SESSION['ultimo_uso'] ?? 0) > SESSAO_OCIOSA_SEG;
        $velha = $agora - ($_SESSION['inicio'] ?? 0) > SESSAO_ABSOLUTA_SEG;
        if ($ociosa || $velha) {
            registrar('info', 'sessao_expirada', [
                'admin_id' => $_SESSION['admin_id'],
                'motivo' => $velha ? 'absoluta' : 'ociosa',
            ]);
            encerrar_sessao();
            session_start();
        } else {
            $_SESSION['ultimo_uso'] = $agora;
        }
    }
}

// Chamado depois de conferir senha (e MFA, quando existir).
function entrar_como(int $adminId): void
{
    // ID novo no login: se alguem plantou um ID antes, ele nao vale mais.
    session_regenerate_id(true);
    $_SESSION = [
        'admin_id' => $adminId,
        'inicio' => time(),
        'ultimo_uso' => time(),
        'csrf' => bin2hex(random_bytes(32)),
    ];
}

function encerrar_sessao(): void
{
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 3600,
            'path' => $p['path'],
            'secure' => $p['secure'],
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        session_destroy();
    }
}

function admin_logado_id(): ?int
{
    return isset($_SESSION['admin_id']) ? (int) $_SESSION['admin_id'] : null;
}

// Endpoint que so admin usa: chama isto no topo. Confere tambem no banco
// se a conta continua ativa (desativar no banco derruba na hora).
function exigir_admin(): int
{
    $id = admin_logado_id();
    if ($id !== null) {
        $st = db()->prepare('SELECT 1 FROM admins WHERE id = ? AND ativo = 1');
        $st->execute([$id]);
        if ($st->fetchColumn()) {
            return $id;
        }
        encerrar_sessao();
    }
    responder(401, ['erro' => 'nao_autenticado']);
}

// --- CSRF ------------------------------------------------------------------
// Impede que OUTRO site faca o navegador da dona mandar um POST pra ca.
// O front pega o token em GET /api/sessao.php e manda de volta no header
// X-CSRF-Token em todo POST. Outro site nao consegue ler esse token.

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function exigir_csrf(): void
{
    $enviado = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $esperado = $_SESSION['csrf'] ?? '';
    // hash_equals compara em tempo constante (nao vaza por cronometro).
    if ($esperado === '' || !is_string($enviado) || !hash_equals($esperado, $enviado)) {
        registrar('aviso', 'csrf_invalido', []);
        responder(403, ['erro' => 'csrf_invalido']);
    }
}
