# Backend

API em PHP 8 + MariaDB/MySQL, sem framework, pensada para a Hostinger
compartilhada. Toda etapa termina com uma checagem contra a checklist de
seguranca (`SEGURANCA.md`, que fica so na maquina local, fora do git).

## Estrutura

```
backend/
├── public/api/        pontos de entrada (na Hostinger: public_html/api/)
│   ├── saude.php      GET -> {"ok":true} se PHP e banco respondem
│   ├── grades.php     GET -> grade no ar de cada unidade + cancelamentos (7 dias)
│   ├── sessao.php     GET -> logado? + token CSRF
│   ├── login.php      POST {email, senha} (CSRF, rate limit) -> pede o codigo
│   ├── login-mfa.php  POST {codigo} (6 digitos do app autenticador)
│   ├── logout.php     POST (CSRF)
│   ├── lead.php       POST formulario de agendamento (publico: CSRF, honeypot, rate limit)
│   ├── admin-grade.php POST {unidade, grade, origem} -- so admin (CSRF)
│   ├── admin-versoes.php GET ?unidade= -- historico (so admin)
│   ├── admin-desfazer.php POST {unidade} -- volta pra versao anterior (so admin, CSRF)
│   ├── admin-cancelamentos.php GET ?unidade=&data= -- aulas do dia + proximos cancelamentos (so admin)
│   ├── admin-cancelar.php POST {unidade, data, hora, modalidade} ou {unidade, data, dia_inteiro} (so admin, CSRF)
│   ├── admin-descancelar.php POST (mesmo formato) -- desfaz (so admin, CSRF)
│   ├── admin-leads.php GET ?unidade=&status=&pagina= -- lista de leads (so admin)
│   ├── admin-leads-resumo.php GET ?unidade= -- numeros por mes, sem dado pessoal (so admin)
│   ├── admin-lead-status.php POST {id, status} (so admin, CSRF)
│   └── admin-lead-excluir.php POST {id} -- apaga de vez, LGPD (so admin, CSRF)
├── src/               fora da raiz web: config, banco, respostas, log
├── bin/migrate.php    roda as migrations (so pela linha de comando)
├── sql/migrations/    NNN_nome.up.sql + NNN_nome.down.sql
├── docker/            ambiente local (PHP+Apache e init do banco)
├── docker-compose.yml
├── .env.example       modelo -- o .env de verdade nunca vai pro git
├── logs/              criado sozinho, ignorado pelo git
└── cache/             JSON pronto da grade (60 s), ignorado pelo git
```

`src/` e `.env` ficam um nivel ACIMA de `public/`. Na Hostinger e igual:
`public_html/api/` + `src/` e `.env` na pasta do dominio, fora do
`public_html`. Assim o navegador nunca alcanca codigo nem senha.

## Rodar local (Docker)

```bash
cd backend
cp .env.example .env        # e troque as senhas (openssl rand -hex 24)
docker compose up -d --build
docker compose exec php php bin/migrate.php up
```

| O que | Onde |
|---|---|
| API | http://localhost:8080/api/saude.php |
| phpMyAdmin | http://localhost:8081 (usuario `root` e `DB_ROOT_PASS`) |
| Banco (cliente externo) | `127.0.0.1:3307` |
| Site com a API | `cd frontend && npm run dev` -- o Vite repassa `/api` para a porta 8080 |

Os usuarios do banco sao criados na PRIMEIRA subida do volume. Se mudar as
senhas do `.env` depois, recrie: `docker compose down -v` (apaga os dados
locais) e suba de novo.

## Usuarios do banco (menor privilegio)

| Usuario | Pode | Quem usa |
|---|---|---|
| `DB_USER` | SELECT, INSERT, UPDATE, DELETE | a API |
| `DB_MIGRA_USER` | tudo no banco do projeto | so o `bin/migrate.php` |

## Migrations

```bash
docker compose exec php php bin/migrate.php status
docker compose exec php php bin/migrate.php up     # aplica pendentes
docker compose exec php php bin/migrate.php down   # desfaz a ultima
```

Nunca editar uma migration que ja rodou em producao: crie a proxima (`002_...`).

## Conta do dashboard

```bash
docker compose exec php php bin/admin.php
```

Cria a conta da dona (ou troca a senha, se o e-mail ja existir). E o UNICO
jeito de criar conta: o site nao tem pagina de cadastro. Senha com no minimo
12 caracteres, guardada so como hash Argon2id.

## Verificacao em duas etapas (MFA)

```bash
docker compose exec php php bin/mfa.php
```

Liga o MFA de uma conta (mostra a chave pra cadastrar no Google/Microsoft
Authenticator e so grava depois de conferir um codigo). Rodando de novo numa
conta com MFA, oferece desligar -- e o caminho se a dona perder o celular.
Em producao (`APP_ENV=prod`) conta sem MFA nao entra.

**Mantenha-me conectado** (`src/aparelho.php`): marcando a caixinha no login,
depois do codigo aquele navegador fica lembrado por 30 dias e nao pede mais o
codigo (a senha e pedida sempre). Trocar a senha (`bin/admin.php`) ou
ligar/desligar o MFA (`bin/mfa.php`) faz TODOS os aparelhos pedirem o codigo
de novo -- e o caminho se a dona perder o celular ou o notebook.

## Dados de exemplo (seed)

```bash
docker compose exec php php bin/seed.php
```

Coloca a grade de exemplo (`sql/seeds/grade-exemplo.json`) no banco. So roda
com `APP_ENV=dev`. Cada execucao cria uma versao nova da grade de cada
unidade; as anteriores ficam guardadas.

A validacao de aula (dia, hora `HH:MM`, nome da modalidade) fica em
`src/grade.php` e vale pra tudo que grava grade: seed, upload e edicao.

## Limpeza dos leads (LGPD, 6 meses)

```bash
docker compose exec php php bin/limpar-leads.php --simular   # so conta
docker compose exec php php bin/limpar-leads.php             # apaga
```

Apaga leads com mais de 6 meses (`LEAD_RETENCAO_MESES` em `src/leads.php`),
qualquer status. Na Hostinger roda sozinho por Cron Job (hPanel > Avancado >
Cron Jobs), 1x por dia de madrugada:
`/usr/bin/php /home/<usuario>/domains/<dominio>/bin/limpar-leads.php`.
O log guarda so quantos foram apagados.

## Rotas da API (nada exposto sem querer)

```bash
docker compose exec php php bin/rotas.php
```

Confere todo arquivo de `public/api/`: rota que nao esta na lista de publicas
precisa de `exigir_admin()`, rota que grava precisa de `exigir_csrf()`, e
toda rota precisa de `exigir_metodo()`. Rodar antes de todo commit que mexe
na API. O `public/api/.htaccess` so deixa responder `nome.php` (arquivo com
`_` no comeco, backup ou `.txt` dao 403).

## Banco

| Tabela | Para que |
|---|---|
| `unidades` | as 4 unidades + qual versao da grade esta no ar (`grade_ativa_id`) |
| `grade_versoes` | cada upload/edicao vira uma versao; a anterior fica guardada (rollback) |
| `aulas` | aulas de uma versao: dia, hora, modalidade |
| `cancelamentos` | aula cancelada numa DATA real (vale so aquela semana) |
| `admins` | login do dashboard (senha em hash, segredo do MFA criptografado) |
| `tentativas` | rate limit de login/lead/upload (so HMAC do IP/e-mail) |
| `dispositivos_confiaveis` | "mantenha-me conectado": aparelho que pula o codigo do MFA por 30 dias (so hash do segredo) |
| `leads` | formulario de agendamento: so o necessario + prova do consentimento (retencao 6 meses) |

## Proximos passos

1. Politica de Privacidade (aguardando o advogado).
2. Deploy na Hostinger.

## Producao (Hostinger) -- a detalhar no deploy

- Migrations: pelo SSH (se o plano tiver) ou colando o `.up.sql` no phpMyAdmin.
- O `.env` do servidor tem so o `DB_USER`; o usuario de migration nao fica la.
- `APP_ENV=prod`.
- HTTPS: ligar o SSL e o "Forcar HTTPS" no hPanel.
- Banco fechado: NAO liberar "MySQL remoto" no hPanel (o banco so aceita
  conexao do proprio servidor). phpMyAdmin so pelo login do hPanel.
- Senhas do banco de producao novas e longas (nunca as do `.env` local).
- Segredos: nada de chave em variavel `VITE_*` -- tudo que comeca com
  `VITE_` vai parar no JavaScript publico do site.
