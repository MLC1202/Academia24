<?php
declare(strict_types=1);

// POST /api/lead.php  -- formulario "Agende sua aula experimental" (PUBLICO)
// Header obrigatorio: X-CSRF-Token (vem do GET /api/sessao.php)
//
// Corpo:
//   { unidade, periodo, objetivo, nome, telefone, email,
//     menor: "Ana" | null,   <- opcional; preenchido = nome/telefone/e-mail
//                               sao do responsavel legal
//     consentimento: true, consentimento_versao: "2026-10-07",
//     referencia: "" }   <- honeypot, sempre vazio
//
// Respostas:
//   201 { ok: true }
//   400 { erro: "campo_desconhecido" | "muito_rapido" | "json_invalido" }
//   403 { erro: "csrf_invalido" | "origem_invalida" }
//   409 { erro: "consentimento_desatualizado" }   -- recarregue a pagina
//   422 { erro: "dados_invalidos", campos: { nome: "invalido", ... } }
//   429 { erro: "muitas_tentativas", tente_em_segundos }

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/limite.php';
require __DIR__ . '/../../src/leads.php';

exigir_metodo('POST');
iniciar_sessao();
exigir_csrf();
exigir_mesma_origem();

// 1. Limite por IP: conta TODO envio (valido, invalido ou de robo).
$ip = ip_cliente();
if (tentativas_recentes('lead_ip', $ip, LEAD_JANELA_IP_SEG) >= LEAD_MAX_POR_IP) {
    registrar('aviso', 'lead_bloqueado', ['por' => 'ip']);
    bloquear_com_429(LEAD_JANELA_IP_SEG);
}
registrar_tentativa('lead_ip', $ip);

$j = ler_json(4_000);

// 2. So os campos conhecidos.
if (array_diff(array_keys($j), LEAD_CAMPOS)) {
    responder(400, ['erro' => 'campo_desconhecido']);
}

// 3. Honeypot: pessoa nao ve o campo, robo preenche. Finge que deu certo
//    (robo nao aprende o que o pegou) e nao grava nada.
$isca = $j['referencia'] ?? '';
if (!is_string($isca) || $isca !== '') {
    registrar('aviso', 'lead_robo', ['motivo' => 'honeypot']);
    responder(201, ['ok' => true]);
}

// 4. Tempo minimo desde que a pagina pediu a sessao. Aqui NAO finjo
//    sucesso: se for uma pessoa (ex.: sessao expirou), ela so clica de novo.
$desde = $_SESSION['visita_desde'] ?? null;
if (!is_int($desde) || time() - $desde < LEAD_TEMPO_MINIMO_SEG) {
    $_SESSION['visita_desde'] ??= time();
    registrar('aviso', 'lead_robo', ['motivo' => 'rapido_demais']);
    responder(400, ['erro' => 'muito_rapido']);
}

// 5. Validacao por lista branca.
$unidades = db()->query('SELECT slug FROM unidades')->fetchAll(PDO::FETCH_COLUMN);
[$lead, $erros] = validar_lead($j, $unidades);
if ($erros) {
    registrar('info', 'lead_invalido', ['campos' => array_keys($erros)]);
    responder(422, ['erro' => 'dados_invalidos', 'campos' => $erros]);
}

// 6. O texto que a pessoa viu tem que ser o atual.
if (($j['consentimento_versao'] ?? null) !== LEAD_CONSENTIMENTO_VERSAO) {
    responder(409, ['erro' => 'consentimento_desatualizado']);
}

// 7. Limite por e-mail (a mesma pessoa mandando de varios lugares).
if (tentativas_recentes('lead_email', $lead['email'], LEAD_JANELA_EMAIL_SEG) >= LEAD_MAX_POR_EMAIL) {
    registrar('aviso', 'lead_bloqueado', ['por' => 'email']);
    bloquear_com_429(LEAD_JANELA_EMAIL_SEG);
}

// 8. Grava. So prepared statement; a data do consentimento e a do servidor.
db()->prepare(
    'INSERT INTO leads
        (unidade, periodo, objetivo, nome, menor, telefone, email,
         consentimento_em, consentimento_versao)
     VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), ?)'
)->execute([
    $lead['unidade'], $lead['periodo'], $lead['objetivo'],
    $lead['nome'], $lead['menor'], $lead['telefone'], $lead['email'],
    LEAD_CONSENTIMENTO_VERSAO,
]);
$id = (int) db()->lastInsertId();
registrar_tentativa('lead_email', $lead['email']);

// Log sem dado pessoal: so o numero e a unidade.
registrar('info', 'lead_criado', ['id' => $id, 'unidade' => $lead['unidade']]);

responder(201, ['ok' => true]);
