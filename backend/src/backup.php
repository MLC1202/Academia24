<?php
declare(strict_types=1);

// Backup do banco (item O1). Usado por:
//   bin/gerar-chaves-backup.php   cria o "cadeado" e a "chave" (uma vez)
//   bin/backup.php                faz o backup do dia (Cron)
//   bin/restaurar-backup.php      volta um backup pro banco
//   bin/abrir-backup.php          gera um .sql legivel (so pra olhar)
//
// Cadeado e chave (criptografia assimetrica, sodium "sealed box"):
//   - o CADEADO (chave publica) fica no .env do servidor: so TRANCA;
//   - a CHAVE (privada) fica SO com o Matheus, no gerenciador de senhas:
//     e a unica coisa que ABRE. Nunca vai pro servidor.
// Quem invadir o servidor (ou a copia baixada) nao le os backups antigos.
// Perdeu a chave = perdeu os backups.
//
// O arquivo guarda os DADOS (as tabelas sao criadas pelas migrations).
// Assim a restauracao usa o usuario da aplicacao (so SELECT/INSERT/
// UPDATE/DELETE), sem precisar de permissao de mudar tabela.

const BACKUP_DIAS = 30;                   // guarda 30 dias
const BACKUP_MAGIA = "A24BAK1\n";         // comeco de todo arquivo .a24bak
const BACKUP_FORMATO = 1;
// Fora do backup: tentativas (rate limit, passageiro). schema_migrations vai
// so como lista, pra conferir se o banco de destino tem as mesmas tabelas.
const BACKUP_FORA = ['tentativas', 'schema_migrations'];

function backup_pasta(): string
{
    $pasta = dirname(__DIR__) . '/backups';
    if (!is_dir($pasta)) {
        mkdir($pasta, 0700, true);
    }
    return $pasta;
}

function backup_migrations(PDO $pdo): array
{
    return $pdo->query('SELECT versao FROM schema_migrations ORDER BY versao')->fetchAll(PDO::FETCH_COLUMN);
}

// Tabelas do banco + colunas (na ordem) + quais sao binarias.
function backup_estrutura(PDO $pdo): array
{
    $st = $pdo->query(
        "SELECT TABLE_NAME AS tabela, COLUMN_NAME AS coluna, DATA_TYPE AS tipo
           FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          ORDER BY TABLE_NAME, ORDINAL_POSITION"
    );
    $estrutura = [];
    foreach ($st as $c) {
        if (in_array($c['tabela'], BACKUP_FORA, true)) {
            continue;
        }
        $estrutura[$c['tabela']]['colunas'][] = $c['coluna'];
        if (in_array(strtolower($c['tipo']), ['binary', 'varbinary', 'tinyblob', 'blob', 'mediumblob', 'longblob'], true)) {
            $estrutura[$c['tabela']]['binarias'][] = $c['coluna'];
        }
    }
    return $estrutura;
}

// Nome de tabela/coluna vem do proprio banco (INFORMATION_SCHEMA), mas
// confiro mesmo assim antes de colar no SQL.
function backup_nome(string $nome): string
{
    if (preg_match('/^[a-z0-9_]+$/', $nome) !== 1) {
        throw new RuntimeException('nome de tabela/coluna inesperado');
    }
    return "`{$nome}`";
}

// Le o banco inteiro (menos BACKUP_FORA) num array.
function backup_montar(PDO $pdo): array
{
    $dados = [
        'formato' => BACKUP_FORMATO,
        'criado_em' => gmdate('Y-m-d\TH:i:s\Z'),
        'migrations' => backup_migrations($pdo),
        'tabelas' => [],
    ];
    foreach (backup_estrutura($pdo) as $tabela => $info) {
        $binarias = $info['binarias'] ?? [];
        $cols = implode(', ', array_map('backup_nome', $info['colunas']));
        $linhas = [];
        foreach ($pdo->query("SELECT {$cols} FROM " . backup_nome($tabela), PDO::FETCH_NUM) as $linha) {
            foreach ($info['colunas'] as $i => $col) {
                if ($linha[$i] !== null && in_array($col, $binarias, true)) {
                    $linha[$i] = base64_encode($linha[$i]);
                }
            }
            $linhas[] = $linha;
        }
        $dados['tabelas'][$tabela] = ['colunas' => $info['colunas'], 'binarias' => $binarias, 'linhas' => $linhas];
    }
    return $dados;
}

function backup_hex(string $hex, int $bytes, string $nome): string
{
    $bin = preg_match('/^[0-9a-f]+$/i', $hex) === 1 ? hex2bin($hex) : false;
    if ($bin === false || strlen($bin) !== $bytes) {
        throw new RuntimeException("{$nome} invalida (precisa ter " . ($bytes * 2) . ' caracteres hex)');
    }
    return $bin;
}

// array -> JSON -> gzip -> trancado com o cadeado.
function backup_trancar(array $dados, string $cadeadoHex): string
{
    $cadeado = backup_hex($cadeadoHex, SODIUM_CRYPTO_BOX_PUBLICKEYBYTES, 'APP_BACKUP_CADEADO');
    $json = json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    return BACKUP_MAGIA . sodium_crypto_box_seal(gzencode($json, 9), $cadeado);
}

// Arquivo + chave -> array. Erro claro se a chave nao for a certa.
function backup_abrir(string $conteudo, string $chaveHex): array
{
    if (!str_starts_with($conteudo, BACKUP_MAGIA)) {
        throw new RuntimeException('isto nao e um arquivo de backup (.a24bak)');
    }
    $par = backup_hex(trim($chaveHex), SODIUM_CRYPTO_BOX_KEYPAIRBYTES, 'chave do backup');
    $gz = sodium_crypto_box_seal_open(substr($conteudo, strlen(BACKUP_MAGIA)), $par);
    if ($gz === false) {
        throw new RuntimeException('a chave nao abre este backup (chave errada ou arquivo corrompido)');
    }
    $json = gzdecode($gz);
    $dados = $json === false ? null : json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($dados) || ($dados['formato'] ?? null) !== BACKUP_FORMATO || !is_array($dados['tabelas'] ?? null)) {
        throw new RuntimeException('conteudo do backup em formato desconhecido');
    }
    return $dados;
}

// Grava atomico (temporario + renomeia) e so o dono le (600).
function backup_gravar(string $arquivo, string $conteudo): void
{
    $tmp = $arquivo . '.tmp';
    file_put_contents($tmp, $conteudo, LOCK_EX);
    chmod($tmp, 0600);
    rename($tmp, $arquivo);
}

// Apaga os backups com mais de BACKUP_DIAS. Devolve quantos apagou.
function backup_faxina(string $pasta, ?int $agora = null): int
{
    $limite = ($agora ?? time()) - BACKUP_DIAS * 86400;
    $n = 0;
    foreach (glob($pasta . '/*.a24bak') ?: [] as $arq) {
        if (filemtime($arq) < $limite) {
            unlink($arq);
            $n++;
        }
    }
    return $n;
}

// Pergunta no terminal sem mostrar o que e digitado.
function ler_escondido(string $texto): string
{
    echo $texto;
    $terminal = function_exists('posix_isatty') ? posix_isatty(STDIN) : true;
    if ($terminal) {
        shell_exec('stty -echo 2>/dev/null');
    }
    $valor = trim((string) fgets(STDIN));
    if ($terminal) {
        shell_exec('stty echo 2>/dev/null');
    }
    echo PHP_EOL;
    return $valor;
}
