# Backend

Ainda não implementado. O front já está pronto para conversar com ele.

## O que precisa existir

Um endpoint que receba o lead por `POST` em JSON e grave no banco da
Hostinger. O front chama isso em um lugar só:
`frontend/src/lib/lead.ts` — hoje a função apenas registra no console.

## Formato que o front envia

Dois tipos de lead, com um campo `tipo` diferenciando. Campos comuns:
`nome`, `whatsapp`, `unidade`, `origem`, `criadoEm`.

**Formulário da home** (`tipo: "rede"`) — a pessoa ainda está escolhendo:

```json
{
  "tipo": "rede",
  "nome": "Matheus Cardoso",
  "email": "teco@email.com",
  "whatsapp": "(11) 98765-4321",
  "unidade": "alphaville",
  "objetivo": "massamuscular",
  "periodo": "noite",
  "origem": "/",
  "criadoEm": "2026-09-10T03:00:00.000Z"
}
```

**Formulário da unidade** (`tipo: "unidade"`) — a pessoa já escolheu, e o
interesse vem do botão que ela clicou:

```json
{
  "tipo": "unidade",
  "nome": "Matheus Cardoso",
  "whatsapp": "(19) 99888-7766",
  "unidade": "cambui",
  "interesse": "planos",
  "origem": "/unidades/cambui",
  "criadoEm": "2026-09-10T03:00:00.000Z"
}
```

`unidade` é sempre `alphaville` | `norte` | `cambui` | `lagoa`.
`interesse` é `aula` | `planos`.

## Tabela sugerida

Uma tabela só, com as colunas que não se aplicam ficando nulas — o
dashboard lê tudo junto e dá para comparar o volume de lead da home com o
das landing pages.

```sql
CREATE TABLE leads (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  tipo       ENUM('rede','unidade')                        NOT NULL,
  nome       VARCHAR(120)                                  NOT NULL,
  whatsapp   VARCHAR(20)                                   NOT NULL,
  unidade    ENUM('alphaville','norte','cambui','lagoa')   NOT NULL,
  email      VARCHAR(160)     NULL,  -- só no tipo 'rede'
  objetivo   VARCHAR(40)      NULL,  -- só no tipo 'rede'
  periodo    VARCHAR(20)      NULL,  -- só no tipo 'rede'
  interesse  ENUM('aula','planos') NULL,  -- só no tipo 'unidade'
  origem     VARCHAR(120)                                  NOT NULL,
  criado_em  DATETIME                                      NOT NULL,
  INDEX (unidade),
  INDEX (criado_em)
);
```

## Ao implementar

- Validar tudo de novo no servidor: o front valida, mas dá para burlar.
- Usar prepared statements — nunca concatenar SQL.
- Nada de credencial de banco no front. O arquivo `.env` fica aqui.
- O dashboard em `/admin/dashboard` vai precisar de autenticação de
  verdade antes de expor os leads.
