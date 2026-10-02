<?php
declare(strict_types=1);

// Envia e-mail pela caixa da Hostinger (SMTP), sem biblioteca.
// .env: SMTP_HOST, SMTP_PORTA (465 = SSL desde o primeiro byte), SMTP_USUARIO
// (o endereco da caixa, ex.: alertas@academia24hclub.com) e SMTP_SENHA.
//
// Seguranca:
//  - conexao sempre criptografada e com o certificado do servidor CONFERIDO
//    (ninguem no meio do caminho le a senha da caixa);
//  - destinatario validado e assunto sem quebra de linha (ninguem "injeta"
//    outro destinatario ou cabecalho);
//  - corpo em base64: qualquer texto passa sem quebrar o protocolo.

function email_conversar($conexao, ?string $comando, int $esperado): string
{
    if ($comando !== null) {
        fwrite($conexao, $comando . "\r\n");
    }
    $resposta = '';
    while (($linha = fgets($conexao, 1024)) !== false) {
        $resposta .= $linha;
        if (strlen($linha) < 4 || $linha[3] !== '-') {
            break; // ultima linha da resposta ("250 ok", nao "250-...")
        }
    }
    if ((int) substr($resposta, 0, 3) !== $esperado) {
        // Nunca repete o comando no erro (podia ser a senha em base64).
        throw new RuntimeException('SMTP recusou (esperava ' . $esperado . '): ' . trim(substr($resposta, 0, 120)));
    }
    return $resposta;
}

function enviar_email(string $para, string $assunto, string $texto): void
{
    if (filter_var($para, FILTER_VALIDATE_EMAIL) === false) {
        throw new InvalidArgumentException('destinatario invalido');
    }
    $assunto = str_replace(["\r", "\n"], ' ', $assunto);
    $de = config('SMTP_USUARIO');
    $host = config('SMTP_HOST');

    $contexto = stream_context_create(['ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'peer_name' => $host,
    ]]);
    $conexao = @stream_socket_client(
        'ssl://' . $host . ':' . config('SMTP_PORTA'),
        $errno,
        $errstr,
        15,
        STREAM_CLIENT_CONNECT,
        $contexto,
    );
    if ($conexao === false) {
        throw new RuntimeException('SMTP: nao conectou em ' . $host . ' (servidor fora do ar, porta errada ou certificado nao confiavel' . ($errstr !== '' ? ": {$errstr}" : '') . ')');
    }
    stream_set_timeout($conexao, 15);

    try {
        email_conversar($conexao, null, 220);
        email_conversar($conexao, 'EHLO ' . (gethostname() ?: 'academia24'), 250);
        email_conversar($conexao, 'AUTH LOGIN', 334);
        email_conversar($conexao, base64_encode($de), 334);
        email_conversar($conexao, base64_encode(config('SMTP_SENHA')), 235);
        email_conversar($conexao, "MAIL FROM:<{$de}>", 250);
        email_conversar($conexao, "RCPT TO:<{$para}>", 250);
        email_conversar($conexao, 'DATA', 354);

        $dominio = substr($de, strrpos($de, '@') + 1);
        $mensagem = implode("\r\n", [
            'From: Site Rede 24 <' . $de . '>',
            'To: <' . $para . '>',
            'Subject: =?UTF-8?B?' . base64_encode($assunto) . '?=',
            'Date: ' . date(DATE_RFC2822),
            'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $dominio . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            rtrim(chunk_split(base64_encode($texto), 76, "\r\n")),
        ]);
        email_conversar($conexao, $mensagem . "\r\n.", 250);
        email_conversar($conexao, 'QUIT', 221);
    } finally {
        fclose($conexao);
    }
}
