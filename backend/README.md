# Backend

API em PHP 8 + MariaDB/MySQL, sem framework, pensada para a Hostinger
compartilhada. Toda etapa termina com uma checagem contra a checklist de
seguranca (`SEGURANCA.md`, que fica so na maquina local, fora do git).

## Estrutura

```
backend/
├── public/api/        pontos de entrada (na Hostinger: public_html/api/)
│   └── saude.php      GET -> {"ok":true} se PHP e banco respondem
├── src/               fora da raiz web: config, banco, respostas, log
├── bin/migrate.php    roda as migrations (so pela linha de comando)
├── sql/migrations/    NNN_nome.up.sql + NNN_nome.down.sql
├── docker/            ambiente local (PHP+Apache e init do banco)
├── docker-compose.yml
├── .env.example       modelo -- o .env de verdade nunca vai pro git
└── logs/              criado sozinho, ignorado pelo git
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

## Banco

| Tabela | Para que |
|---|---|
| `unidades` | as 4 unidades + qual versao da grade esta no ar (`grade_ativa_id`) |
| `grade_versoes` | cada upload/edicao vira uma versao; a anterior fica guardada (rollback) |
| `aulas` | aulas de uma versao: dia, hora, modalidade |
| `cancelamentos` | aula cancelada numa DATA real (vale so aquela semana) |
| `admins` | login do dashboard (senha em hash, segredo do MFA criptografado) |
| `tentativas` | rate limit de login/lead/upload (so HMAC do IP/e-mail) |

## Proximos passos

1. `GET /api/grades.php` + trocar `frontend/src/lib/grade-store.ts` para `fetch`.
2. Login do admin (sessao, CSRF, rate limit, MFA).
3. Upload da grade (Excel lido no navegador) e cancelamentos.
4. Leads do agendamento (destino a decidir; LGPD).

## Producao (Hostinger) -- a detalhar no deploy

- Migrations: pelo SSH (se o plano tiver) ou colando o `.up.sql` no phpMyAdmin.
- O `.env` do servidor tem so o `DB_USER`; o usuario de migration nao fica la.
- `APP_ENV=prod`.
