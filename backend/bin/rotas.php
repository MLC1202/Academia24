<?php
declare(strict_types=1);

// Confere se alguma rota da API ficou exposta sem querer.
//
//   docker compose exec php php bin/rotas.php
//
// Regras (toda rota nova tem que passar aqui antes do commit):
//  1. Toda rota que nao esta na lista PUBLICAS precisa chamar exigir_admin().
//  2. Toda rota que aceita POST/PUT/PATCH/DELETE precisa chamar exigir_csrf()
//     (menos as que nao tem sessao nenhuma -- hoje nao existe nenhuma).
//  3. Toda rota precisa chamar exigir_metodo() (so os metodos esperados).
// Sai com erro (codigo 1) se alguma regra falhar.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

// Rotas que QUALQUER visitante pode chamar, de proposito.
const PUBLICAS = ['saude', 'grades', 'sessao', 'login', 'login-mfa', 'logout'];

$pasta = dirname(__DIR__) . '/public/api';
$problemas = 0;

foreach (glob("$pasta/*.php") as $arquivo) {
    $nome = basename($arquivo, '.php');
    $codigo = file_get_contents($arquivo);
    // Ignora comentarios pra ninguem "passar" a regra so citando a funcao.
    $codigo = implode('', array_map(
        fn($t) => is_array($t) && in_array($t[0], [T_COMMENT, T_DOC_COMMENT], true) ? '' : (is_array($t) ? $t[1] : $t),
        token_get_all($codigo),
    ));

    $publica = in_array($nome, PUBLICAS, true);
    $temAdmin = str_contains($codigo, 'exigir_admin(');
    $temCsrf = str_contains($codigo, 'exigir_csrf(');
    $temMetodo = preg_match('/exigir_metodo\(([^)]*)\)/', $codigo, $m) === 1;
    $escreve = $temMetodo && preg_match('/POST|PUT|PATCH|DELETE/', $m[1]) === 1;

    $erros = [];
    if (!$temMetodo) {
        $erros[] = 'sem exigir_metodo()';
    }
    if (!$publica && !$temAdmin) {
        $erros[] = 'nao e publica e nao chama exigir_admin()';
    }
    if ($escreve && !$temCsrf) {
        $erros[] = 'aceita escrita sem exigir_csrf()';
    }

    $tipo = $publica ? 'publica' : 'admin  ';
    echo ($erros ? 'FALHA ' : 'ok    ') . "$tipo  $nome.php" . ($erros ? '  -> ' . implode('; ', $erros) : '') . PHP_EOL;
    $problemas += count($erros);
}

if ($problemas > 0) {
    fwrite(STDERR, "\n{$problemas} problema(s). Corrija antes do commit.\n");
    exit(1);
}
echo "\nNenhuma rota exposta.\n";
