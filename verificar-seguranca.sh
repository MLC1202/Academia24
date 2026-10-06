#!/usr/bin/env bash
# Verificacao automatica de seguranca do Academia24 (checklist backend/SEGURANCA.md).
# So LE e roda checagens: nunca altera nenhum arquivo.
#
#   ./verificar-seguranca.sh
#
# Resultado: OK / AVISO (conferir a mao) / FALHA (corrigir antes do commit).
# Sai com codigo 1 se houver alguma FALHA.
# Usado pelo subagente .claude/agents/verificador-seguranca.md (Claude Code).
# Compativel com o bash 3.2 do macOS.

cd "$(dirname "$0")" || exit 1
RAIZ="$(pwd)"
falhas=0
avisos=0

ok()    { echo "  OK     $1"; }
aviso() { echo "  AVISO  $1"; avisos=$((avisos + 1)); }
falha() { echo "  FALHA  $1"; falhas=$((falhas + 1)); }
tem()   { grep -qF -- "$2" "$1" 2>/dev/null; }

# ---------------------------------------------------------------------------
echo "== PHP (sintaxe + rotas expostas)"
cd "$RAIZ/backend" || exit 1
PHP=""
if docker compose ps --status running 2>/dev/null | grep -q php; then
    PHP="docker compose exec -T php php"
elif command -v php >/dev/null 2>&1; then
    PHP="php"
fi
if [ -z "$PHP" ]; then
    aviso "Docker parado e sem PHP no Mac: sintaxe e rotas NAO conferidas (rode 'docker compose up -d')"
else
    erros=""
    for f in src/*.php bin/*.php public/api/*.php; do
        $PHP -l "$f" >/dev/null 2>&1 || erros="$erros $f"
    done
    if [ -z "$erros" ]; then ok "sintaxe de todos os .php"; else falha "erro de sintaxe em:$erros"; fi
    if $PHP bin/rotas.php >/tmp/a24-rotas.txt 2>&1; then
        ok "rotas: toda rota admin tem exigir_admin, toda escrita tem CSRF, todas tem exigir_metodo"
    else
        falha "rotas expostas (bin/rotas.php):"; grep FALHA /tmp/a24-rotas.txt | sed 's/^/           /'
    fi
fi

# ---------------------------------------------------------------------------
echo "== Banco (SQL injection, menor privilegio)"
# O7: na Hostinger o usuario do banco pode tudo; a compensacao e o codigo do
# site NUNCA mudar tabela. DDL so em bin/migrate.php e sql/migrations.
ddl=$(grep -rnE "['\"][[:space:]]*(CREATE|ALTER|DROP|TRUNCATE|GRANT|RENAME)[[:space:]]" src public 2>/dev/null)
if [ -z "$ddl" ]; then ok "nenhum CREATE/ALTER/DROP/TRUNCATE/GRANT no codigo do site (src/, public/)"
else falha "comando que muda tabela no codigo do site:"; echo "$ddl" | sed 's/^/           /'; fi
grep -qF "ATTR_EMULATE_PREPARES => false" src/db.php && ok "prepared statements reais (EMULATE_PREPARES false)" || falha "src/db.php sem ATTR_EMULATE_PREPARES => false"
# Variavel colada dentro de SQL: nao e erro por si (ex.: \$where montado de
# pedacos fixos), mas cada caso precisa ser conferido.
interp=$(grep -rnE "(query|exec|prepare)\([^)]*\"[^\"]*\\\$[a-zA-Z_]" src public bin 2>/dev/null | grep -v "bin/migrate.php" | grep -vE "^[^:]+:[0-9]+:[[:space:]]*//")
if [ -z "$interp" ]; then ok "nenhuma variavel colada dentro de SQL"
else
    n=$(echo "$interp" | wc -l | tr -d ' ')
    aviso "$n trecho(s) com variavel dentro do SQL -- conferir se cada uma vem de valor fixo do codigo (nunca do visitante):"
    echo "$interp" | sed 's/^/           /'
fi

# ---------------------------------------------------------------------------
echo "== Configuracao e segredos"
grep -qF "config('APP_ENV') !== 'dev'" src/config.php && ok "APP_ENV fail-closed (so 'dev' relaxa)" || falha "src/config.php: em_producao() nao e fail-closed (S1)"
grep -qF "exigir_dev_so_local();" src/bootstrap.php && ok "trava: APP_ENV=dev so na maquina local" || falha "src/bootstrap.php sem exigir_dev_so_local() (S1)"
antes=$falhas
for linha in "backend/.env" ".env" "backend/backups" "*.pem" "*.key"; do
    grep -qxF "$linha" "$RAIZ/.gitignore" || falha ".gitignore sem a linha '$linha'"
done
[ "$falhas" -eq "$antes" ] && ok ".gitignore conferido (.env, backups, chaves)"
for chave in $(grep -oE '^[A-Z_]+=' .env.example | tr -d '='); do
    case "$chave" in *PASS|*SENHA|*CHAVE*|*CADEADO)
        valor=$(grep -E "^$chave=" .env.example | cut -d= -f2-)
        case "$valor" in ""|troque*) ;; *) falha ".env.example com valor real em $chave (so modelo!)";; esac ;;
    esac
done
[ "$falhas" -eq "$antes" ] && ok ".env.example sem segredo real"
vite=$(grep -rnoE "VITE_[A-Z_]+" "$RAIZ/frontend/src" "$RAIZ/frontend/vite.config.ts" 2>/dev/null | grep -v "VITE_SEM_API" )
[ -z "$vite" ] && ok "nenhuma variavel VITE_* alem de VITE_SEM_API (nada secreto no front)" || { aviso "variavel VITE_* nova (vai pro JavaScript PUBLICO):"; echo "$vite" | sed 's/^/           /'; }

# ---------------------------------------------------------------------------
echo "== Sessao, senhas, MFA"
grep -qE "SESSAO_OCIOSA_SEG = 30 \* 60" src/sessao.php && ok "sessao ociosa 30 min" || falha "src/sessao.php: SESSAO_OCIOSA_SEG mudou"
grep -qE "SESSAO_ABSOLUTA_SEG = 8 \* 3600" src/sessao.php && ok "sessao absoluta 8 h" || falha "src/sessao.php: SESSAO_ABSOLUTA_SEG mudou"
grep -qF "'httponly' => true" src/sessao.php && grep -qF "'samesite' => 'Strict'" src/sessao.php && ok "cookie HttpOnly + SameSite=Strict" || falha "cookie de sessao sem HttpOnly/SameSite Strict"
grep -qF "session_regenerate_id(true)" src/sessao.php && ok "ID da sessao trocado no login" || falha "sem session_regenerate_id no login"
grep -qF "PASSWORD_ARGON2ID" src/senha.php && ok "senhas com Argon2id (bcrypt de reserva)" || falha "src/senha.php sem Argon2id"
grep -qF "mfa_obrigatorio" public/api/login.php && ok "MFA obrigatorio em producao" || falha "login.php nao exige MFA em producao"
grep -rqE "md5\(|sha1\(" src public 2>/dev/null && falha "md5/sha1 no codigo (nunca pra senha)" || ok "sem md5/sha1"

# ---------------------------------------------------------------------------
echo "== Logs (sem dado pessoal)"
pii=$(grep -rnE "registrar\([^;]*'(nome|email|e-mail|telefone|senha|codigo|csrf)'[[:space:]]*=>" src public bin 2>/dev/null)
[ -z "$pii" ] && ok "nenhum registrar() com nome/e-mail/telefone/senha" || { falha "dado pessoal ou segredo indo pro log:"; echo "$pii" | sed 's/^/           /'; }

# ---------------------------------------------------------------------------
echo "== Servidor (.htaccess)"
H="$RAIZ/frontend/public/.htaccess"
antes=$falhas
for item in "Content-Security-Policy" "script-src 'self'" "frame-ancestors 'none'" "Strict-Transport-Security" "X-Content-Type-Options" "Options -Indexes" "@@REDIRECIONAMENTO_DE_DOMINIOS@@"; do
    tem "$H" "$item" || falha "frontend/public/.htaccess sem: $item"
done
grep -qF "RewriteCond %{HTTPS} off [OR]" "$RAIZ/frontend/vite.config.ts" && [ "$falhas" -eq "$antes" ] && ok ".htaccess do site: CSP, HSTS, nosniff, frame-ancestors, sem listagem, http->https" || falha "vite.config.ts sem o redirect http->https (S2)"
A="public/api/.htaccess"
tem "$A" "Require all denied" && tem "$A" "ErrorDocument 404 default" && ok "api/.htaccess: so nome.php responde, 404 sem o site" || falha "public/api/.htaccess mudou (Require all denied / ErrorDocument)"
grep -qE "header\([^)]*Access-Control-Allow-Origin" src/*.php public/api/*.php 2>/dev/null && falha "CORS aberto (header Access-Control-Allow-Origin)" || ok "sem CORS aberto"

# ---------------------------------------------------------------------------
echo "== Frontend (XSS, dependencias)"
cd "$RAIZ/frontend" || exit 1
xss=$(grep -rnE "dangerouslySetInnerHTML|\.innerHTML[[:space:]]*=|eval\(|new Function\(" src 2>/dev/null)
[ -z "$xss" ] && ok "sem dangerouslySetInnerHTML / innerHTML / eval" || { falha "trecho perigoso pra XSS:"; echo "$xss" | sed 's/^/           /'; }
if [ -d node_modules ]; then
    npx tsc -b --noEmit >/tmp/a24-tsc.txt 2>&1 && ok "TypeScript sem erros" || { falha "TypeScript com erros:"; head -5 /tmp/a24-tsc.txt | sed 's/^/           /'; }
    npx eslint src >/tmp/a24-eslint.txt 2>&1 && ok "ESLint sem erros" || { falha "ESLint com erros:"; tail -5 /tmp/a24-eslint.txt | sed 's/^/           /'; }
    if npm audit --audit-level=high >/tmp/a24-audit.txt 2>&1; then ok "npm audit: nenhuma falha alta/critica"
    elif grep -qiE "ENOTFOUND|network|ECONN" /tmp/a24-audit.txt; then aviso "npm audit sem internet: nao conferido"
    else falha "npm audit achou falha alta/critica:"; grep -E "Severity|^[a-z@]" /tmp/a24-audit.txt | head -6 | sed 's/^/           /'; fi
else
    aviso "frontend/node_modules nao existe: rode 'npm install' (TypeScript/ESLint/audit nao conferidos)"
fi
[ -f "$RAIZ/.github/dependabot.yml" ] && ok "Dependabot configurado" || falha ".github/dependabot.yml sumiu"

# ---------------------------------------------------------------------------
echo
echo "Resultado: $falhas falha(s), $avisos aviso(s)."
[ "$falhas" -eq 0 ] || exit 1
