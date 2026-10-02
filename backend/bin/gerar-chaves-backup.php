<?php
declare(strict_types=1);

// Cria o par CADEADO + CHAVE dos backups. Roda UMA vez, no Mac:
//   docker compose exec php php bin/gerar-chaves-backup.php
//
//   CADEADO -> vai no .env (APP_BACKUP_CADEADO), no Mac e no servidor
//   CHAVE   -> SO no gerenciador de senhas. Nunca no servidor nem no projeto.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$par = sodium_crypto_box_keypair();

echo "\nCADEADO (pode ficar no servidor; so tranca):\n";
echo 'APP_BACKUP_CADEADO=' . bin2hex(sodium_crypto_box_publickey($par)) . "\n";
echo "\nCHAVE (so voce guarda; e a unica coisa que abre os backups):\n";
echo bin2hex($par) . "\n\n";
echo "1. Cole a linha APP_BACKUP_CADEADO=... no .env (Mac e servidor).\n";
echo "2. Guarde a CHAVE no gerenciador de senhas (de preferencia em 2 lugares).\n";
echo "   Perdeu a chave = perdeu os backups. Ninguem recupera.\n";
echo "3. Feche este terminal (a chave nao deve ficar na tela).\n\n";
