# Academia 24 Wellness e 24 Health Club

Site institucional das quatro unidades da **Academia 24 Wellness** (Alphaville) e do **24 Health Club** (Norte, Cambuí e Lagoa): apresentação das unidades, grade de aulas coletivas, agendamento de aula experimental e uma área interna para a equipe.

Produção: **https://academia24wellness.com**

---

## Sumário

- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como rodar](#como-rodar)
- [Testes e verificações](#testes-e-verificações)
- [Rotas](#rotas)
- [Onde mexer no conteúdo](#onde-mexer-no-conteúdo)
- [Mídia](#mídia)
- [Google Analytics e cookies](#google-analytics-e-cookies)
- [Privacidade e LGPD](#privacidade-e-lgpd)
- [Produção (Hostinger)](#produção-hostinger)
- [Segurança](#segurança)
- [Documentação relacionada](#documentação-relacionada)

---

## Visão geral

**Site público**
- Home com as unidades, a avaliação com bioimpedância e o convite para a aula experimental.
- Uma página por unidade, com a grade dos próximos 7 dias.
- Formulário de agendamento em passos, com consentimento explícito (LGPD).
- Perguntas frequentes e aviso de cookies com escolha do visitante.
- SEO por página (título, descrição, Open Graph, `sitemap.xml`, `robots.txt`).

**Área interna** (`/admin`, com senha e verificação em duas etapas)
- Lista de leads por unidade e status, resumo por mês, exportação para Excel e exclusão definitiva.
- Cancelamento de aulas numa data específica.
- Botão "Atualizar agora" para buscar a grade de novo na Pacto.

**Grade de aulas.** Vem da API pública da Pacto (o sistema que a academia já usa), com cache de 10 minutos no servidor. Quem atualiza a grade na Pacto vê o site acompanhar sozinho. Se a Pacto falhar, o site continua com a última cópia boa.

## Stack

| Camada | Tecnologia |
|---|---|
| Front | React 19, TypeScript, Vite, React Router |
| API | PHP 8, sem framework |
| Banco | MariaDB/MySQL |
| Hospedagem | Hostinger (plano compartilhado, LiteSpeed) |
| DNS e domínios | Cloudflare (domínio principal), redirecionamento 301 dos domínios antigos |
| Medição | Google Analytics 4 com Consent Mode, Google Search Console |
| Ambiente local | Docker (PHP + Apache + MariaDB + phpMyAdmin) |

## Arquitetura

```
Navegador
   │
   ▼
Hostinger ── public_html/        site estático (build do Vite)
   │         └── api/            endpoints PHP  ──►  MariaDB
   │                                    │
   │                                    └────────►  API pública da Pacto (grade)
   │
   ├── src/  bin/  sql/  .env    fora da raiz web: o navegador nunca alcança
   └── cron: limpeza de leads, backup criptografado, vigia (alertas por e-mail)
```

O front só fala com `/api`. Código PHP, `.env`, logs, cache e backups ficam um nível acima do `public_html`.

## Estrutura do repositório

```
.
├── frontend/              site em React + Vite
│   ├── public/            .htaccess, imagens, logos, vídeo, PDF da política
│   ├── src/
│   │   ├── pages/         uma pasta por página (home, unidades, agendamento, duvidas, admin)
│   │   ├── components/    Header, Footer, AvisoCookies, PlanosModal, WhatsApp...
│   │   ├── data/          unidades, SEO, SITE_URL e GA_ID (site.ts), grade de exemplo
│   │   └── lib/           api, analytics, consentimento, stores da grade e dos leads
│   └── tests/             testes com o node:test
├── backend/               API em PHP (ver backend/README.md)
│   ├── public/api/        endpoints (na Hostinger: public_html/api/)
│   ├── src/               código compartilhado, fora da raiz web
│   ├── bin/               comandos: migrate, admin, mfa, backup, vigia, limpar-leads
│   ├── sql/               migrations e grade de exemplo
│   └── tests/             teste da conversão da Pacto
├── docs/politica/         versões arquivadas da Política de Privacidade
├── .github/               workflow da prévia no GitHub Pages e dependabot
└── verificar-seguranca.sh checagem automática da checklist de segurança
```

## Como rodar

**Requisitos:** Node 24 e npm; Docker (só se for rodar a API local).

**Só o front** (a grade usa dados de exemplo quando não há API):

```bash
cd frontend
npm install
npm run dev
```

**Front com a API local:**

```bash
cd backend
cp .env.example .env        # troque as senhas (openssl rand -hex 24)
docker compose up -d --build
docker compose exec php php bin/migrate.php up
docker compose exec php php bin/admin.php   # cria a conta da área interna

cd ../frontend && npm run dev   # o Vite repassa /api para a porta 8080
```

Passo a passo completo, usuários do banco, MFA e migrations em [backend/README.md](backend/README.md).

## Testes e verificações

```bash
cd frontend
npm test            # lógica pura: consentimento, regras do GA, funil do agendamento
npm run lint
npm run build       # tsc + vite build
```

```bash
# conversão da grade da Pacto (sem rede), a partir de backend/
docker run --rm -v "$PWD":/app -w /app php:8.3-cli php tests/pacto.php
```

```bash
./verificar-seguranca.sh   # checklist de segurança; só lê, não altera nada
```

## Rotas

| Rota | O que é |
|---|---|
| `/` | Home |
| `/unidades` | As 4 unidades e a grade de aulas |
| `/unidades/<slug>` | Uma unidade (`alphaville`, `norte`, `cambui`, `lagoa`) e a grade só dela |
| `/agendamento` | Formulário da aula experimental (aceita `?unidade=<slug>`) |
| `/duvidas` | Perguntas frequentes |
| `/admin/login` · `/admin/dashboard` | Área interna (fora do índice do Google e do GA) |

## Onde mexer no conteúdo

| Preciso mudar | Arquivo |
|---|---|
| Textos, foto e link da LP de uma unidade | `frontend/src/data/unidades.ts` |
| Títulos e descrições de cada página (Google, WhatsApp) | `frontend/src/data/seo.ts` |
| Endereço do site, ID do GA | `frontend/src/data/site.ts` |
| Seções da home | `frontend/src/pages/home/sections/` |
| Menu e logo | `frontend/src/components/Header/Header.tsx` |
| Perguntas frequentes | `frontend/src/pages/duvidas/DuvidasPage.tsx` |
| Formulário de agendamento | `frontend/src/pages/agendamento/FormAgendamento.tsx` |
| Grade de exemplo (dev e prévia do GitHub Pages) | `backend/sql/seeds/grade-exemplo.json` |
| Grade real | na Pacto, não no código |

Enquanto o link da LP de uma unidade estiver vazio em `unidades.ts`, os botões "Conhecer unidade" e "Consultar esta unidade" ficam desativados.

## Mídia

Tudo fica em `frontend/public/` e vai para o build como está. Para trocar, substitua o arquivo **mantendo o mesmo nome**; não precisa mexer no código.

```
frontend/public/
├── .htaccess          rotas do site e cabeçalhos de segurança (não mover)
├── imagens/           hero-poster, duvidas, rede/ e unidades/ (.webp)
├── logos/             24wellness-negativo.svg, 24healthclub-branco.svg
├── videos/hero.mp4
└── politica-de-privacidade.pdf
```

- **Foto:** abrir no [squoosh.app](https://squoosh.app), WebP, qualidade 75, lado maior 1600 px.
- **Vídeo do hero:** 1280 px de largura, sem áudio, H.264. A especificação completa está no topo do `Hero.tsx`.
- Os originais antes da otimização não ficam no repositório.

## Google Analytics e cookies

- **ID:** `GA_ID` em `frontend/src/data/site.ts`. Vazio = GA desligado. O ID não é segredo.
- **Quando liga:** só em produção, no domínio de `SITE_URL`, depois do "Aceitar" no aviso de cookies, e nunca em `/admin`. Regras em `frontend/src/lib/analytics-regras.ts`; todo o resto passa por `frontend/src/lib/analytics.ts`.
- **Eventos:** `clique_whatsapp`, `clique_lp_unidade`, `clique_planos`, `clique_instagram`, `agendamento_passo` (funil, passos 0 a 4) e `agendamento_enviado`. Nenhum carrega nome, telefone ou e-mail. A unidade vai no parâmetro `unidade` dos cliques.
- **Testar antes do deploy:** `VITE_GA_DEBUG=1 npm run build` e depois `npm run preview` liga o GA fora do domínio com `debug_mode` (DebugView no GA). **Não publicar esse build.**
- **CSP:** as origens do Google estão liberadas no `.htaccess`. Tag nova de terceiro exige origem nova lá.
- **No painel do GA:** em Fluxos de dados > Web > Medição otimizada, desligar "Mudanças de página com base em eventos do histórico do navegador" (o site já envia o `page_view` de cada rota). Não ligar o Google Signals.

## Privacidade e LGPD

O formulário guarda só o necessário e a prova do consentimento. Leads têm retenção de 6 meses (limpeza diária por cron). A área interna permite excluir um lead de vez.

**Política de Privacidade.** O PDF vigente fica em `frontend/public/politica-de-privacidade.pdf` e traz a data da última atualização. Ao publicar uma versão nova:

1. guarde uma cópia em `docs/politica/politica-de-privacidade-AAAA-MM-DD.pdf`;
2. suba a mesma data em `CONSENTIMENTO_VERSAO` (`FormAgendamento.tsx`) e `LEAD_CONSENTIMENTO_VERSAO` (`backend/src/leads.php`);
3. publique front e back **juntos**: versões diferentes fazem o envio do formulário falhar.

Passo a passo em [docs/politica/README.md](docs/politica/README.md).

## Produção (Hostinger)

Plano compartilhado com PHP 8.3 e `shell_exec` desativada. SSH pelo hPanel, na porta 65002; o nome do host interno só resolve dentro do servidor, então use o IP que o hPanel mostra.

```
~/domains/academia24wellness.com.br/
├── public_html/   front (conteúdo de frontend/dist/) + api/
├── src/  bin/  sql/
├── .env           permissão 600, criado a partir de backend/.env.example (APP_ENV=prod)
└── backups/  cache/  logs/
```

### Deploy

Rodar **no Mac**, na raiz do projeto, nunca dentro do servidor. Sem `--delete`. Simule antes com `-avn` e só rode de verdade se a lista estiver certa.

```bash
cd frontend && npm run build && cd ..
rsync -av -e "ssh -p 65002" frontend/dist/      USUARIO@IP:domains/academia24wellness.com.br/public_html/
rsync -av -e "ssh -p 65002" backend/src/        USUARIO@IP:domains/academia24wellness.com.br/src/
rsync -av -e "ssh -p 65002" backend/bin/        USUARIO@IP:domains/academia24wellness.com.br/bin/
rsync -av -e "ssh -p 65002" backend/public/api/ USUARIO@IP:domains/academia24wellness.com.br/public_html/api/
```

O `.htaccess` vai junto no build (vem de `frontend/public/`): faz as rotas funcionarem ao recarregar e redireciona 301 os outros domínios. Migration nova roda **antes** de publicar o código que depende dela.

### Crons

No hPanel (Avançado > Cron Jobs). O campo de comando já traz o prefixo `/usr/bin/php /home/USUARIO/`, então só vai o caminho a partir de `domains/`.

| Quando | Comando |
|---|---|
| `0 3 * * *` | `domains/academia24wellness.com.br/bin/limpar-leads.php` |
| `30 3 * * *` | `domains/academia24wellness.com.br/bin/backup.php` |
| `0 * * * *` | `domains/academia24wellness.com.br/bin/vigia.php` |

O servidor usa UTC: o backup das 3:30 aparece com `_0630` no nome do arquivo.

### Alertas por e-mail

O `vigia.php` envia pelo SMTP da Hostinger (`SMTP_*` e `ALERTA_EMAIL_PARA` no `.env`). O usuário SMTP é o endereço completo da caixa criada no hPanel. Trocar a senha da caixa no hPanel **não** atualiza o `.env`. Teste, no servidor: `php bin/vigia.php --teste`.

### Backup

`bin/backup.php` grava `backups/AAAA-MM-DD_HHMM.a24bak` e apaga os com mais de 30 dias. O arquivo é criptografado com chave assimétrica:

- **CADEADO** (`APP_BACKUP_CADEADO`, no `.env`): só tranca.
- **CHAVE**: abre. Fica no gerenciador de senhas, nunca no servidor nem no projeto. Tem 128 caracteres hex, e os últimos 64 são o CADEADO.

Para conferir que um backup abre: `php bin/abrir-backup.php backups/<arquivo>.a24bak`, e **apague o `.sql` gerado** (sem criptografia, com dados pessoais). Erros comuns: colar o CADEADO no lugar da CHAVE, ou copiar um caractere a mais ("precisa ter 128 caracteres hex").

### DNS e domínios

- `academia24wellness.com.br` usa os nameservers da Cloudflare (só DNS, sem proxy).
- `academia24hclub.com` (DNS na GoDaddy) e `24wellness.com.br` apontam para a Hostinger como domínios estacionados e redirecionam 301 para o principal.
- No `academia24hclub.com`, **não mexer** em MX, SPF, DMARC e `autodiscover` (e-mail Microsoft 365), nos CNAMEs do SendGrid nem nos subdomínios `unidade*` (sites das unidades no Lovable).

### Google

- **Search Console:** propriedade do tipo Domínio (verificação por TXT no DNS). O sitemap leva a URL completa: `https://academia24wellness.com.br/sitemap.xml`.
- **Mudança de endereço** do domínio antigo feita em 05/11/2026. O redirecionamento do domínio antigo precisa continuar ativo.

## Segurança

- Nenhum segredo no repositório: `.env`, chaves e senhas ficam fora do git. Nada de chave em variável `VITE_*`, porque tudo que começa assim vai para o JavaScript público.
- Senhas da área interna só como hash Argon2id; MFA obrigatório em produção; limite de tentativas por IP; CSRF nos endpoints que gravam.
- Formulário público com honeypot, validação no servidor e rate limit.
- `.htaccess` com CSP restritiva, HTTPS forçado e cabeçalhos de segurança.
- Banco fechado: sem "MySQL remoto" no hPanel; o usuário da API só tem SELECT/INSERT/UPDATE/DELETE.
- Checklist em `backend/SEGURANCA.md` (fica só na máquina local) e verificação automática com `./verificar-seguranca.sh` antes de cada commit.

## Documentação relacionada

- [backend/README.md](backend/README.md): API, Docker, migrations, MFA, banco e Pacto.
- [docs/politica/README.md](docs/politica/README.md): como trocar a versão da Política de Privacidade.
