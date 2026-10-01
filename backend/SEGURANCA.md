# Segurança — checklist do backend

Referência fixa. **Toda etapa do backend termina com uma checagem dupla contra
esta lista** antes de ser considerada pronta. Item que não se aplica à etapa é
marcado como "n/a", nunca pulado em silêncio.

Contexto: Hostinger compartilhada, PHP 8 + MySQL, front React no mesmo
domínio. Grade de aulas pública, dashboard admin, leads com dados pessoais.

## Transporte e navegador

- [ ] **HTTPS** — SSL ativo, redirect forçado no `.htaccess`, HSTS, cookies `Secure`.
- [ ] **Headers de segurança** — CSP, `X-Content-Type-Options: nosniff`, `frame-ancestors 'none'`, `Referrer-Policy`.
- [ ] **CORS** — mesmo domínio: a API **não** envia `Access-Control-Allow-Origin` (nunca `*`). Em dev, proxy do Vite.
- [ ] **CSRF** — token em todo POST/PUT/DELETE do admin.

## Autenticação e sessão

- [ ] **Senhas com hash** — `password_hash` (Argon2id/bcrypt) + `password_verify`. Nunca texto puro, nunca MD5/SHA.
- [ ] **MFA** — TOTP obrigatório para admin antes do go-live.
- [ ] **Expiração de sessão** — ociosa ~30 min, absoluta ~8 h, `session_regenerate_id` no login, `HttpOnly` + `SameSite=Strict`, logout destrói a sessão.
- [ ] **Rate limit** — login, envio de lead e upload. Tabela MySQL de tentativas (IP + e-mail).
- [ ] **Controle de acesso** — todo endpoint de escrita checa a sessão admin **no servidor**.

## Dados

- [ ] **Validação de inputs** — no servidor, por lista branca (enums, regex `HH:MM`, limites de tamanho). O front valida só por conforto.
- [ ] **Sanitização** — escapar na saída; React sem `dangerouslySetInnerHTML`; exportação de leads sem fórmulas (`=`, `+`, `-`, `@`).
- [ ] **SQL injection** — só PDO com prepared statements, `ATTR_EMULATE_PREPARES = false`. Nunca concatenar SQL.
- [ ] **Criptografia** — em trânsito via HTTPS; segredo do MFA criptografado com sodium; nada de cripto caseira.
- [ ] **LGPD** — consentimento no formulário, prazo de retenção dos leads, forma de exclusão.

## Infra e código

- [ ] **Secrets** — `.env` fora do `public_html` e no `.gitignore`. Zero credencial no front ou no repositório.
- [ ] **Menor privilégio (PMP)** — usuário do banco da aplicação sem `DROP`/`ALTER` (verificar se o hPanel permite; senão, compensar); arquivos 644, pastas 755.
- [ ] **Dependências** — Dependabot + `npm audit`; PHP com o mínimo de bibliotecas.
- [ ] **Migrations** — SQL numerado + tabela `schema_migrations`.
- [ ] **Rollback** — toda migration tem o "down"; upload da grade em transação e guarda a versão anterior.

## Operação

- [ ] **Logs** — logins, falhas, uploads, cancelamentos (quem/quando). Sem senha nem dado pessoal completo. Fora do `public_html`.
- [ ] **Backups** — backup da Hostinger (conferir frequência do plano) + `mysqldump` próprio periódico. Restauração testada.
- [ ] **Monitoramento e alertas** — uptime externo (ex.: UptimeRobot) + alerta por e-mail em picos de falha de login/erro 500.
- [ ] **Plano de recuperação** — onde estão os backups, como restaurar, como trocar senhas/secrets se vazarem, contato da Hostinger.

## Exposicao

- [ ] **XSS** — CSP no `.htaccess` do site (`script-src 'self'`, sem script inline/externo); React sem `dangerouslySetInnerHTML`; lista branca nos textos gravados; API com CSP `default-src 'none'`.
- [ ] **Rota de API exposta** — `php bin/rotas.php` passa (admin -> `exigir_admin()`, escrita -> `exigir_csrf()`, toda rota -> `exigir_metodo()`); `api/.htaccess` so serve `nome.php`; `/api/` inexistente da 404 (nao cai no index.html).
- [ ] **Chave de API exposta** — nada secreto em `VITE_*` nem no codigo do front; `.env`, `*.pem`, `*.key`, dumps no `.gitignore`; `.htaccess` bloqueia `.env`, `.git/`, `.sql`, `.log`, backups mesmo se forem parar no `public_html`.
- [ ] **Banco aberto** — local: porta so em 127.0.0.1; producao: "MySQL remoto" desligado no hPanel, senhas novas e longas, usuario da aplicacao sem DROP/ALTER, nenhuma rota devolve SQL ou erro do banco.
