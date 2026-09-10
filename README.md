# Academia 24

Site da Rede 24 — home institucional com as quatro unidades e uma landing
page por unidade.

```
academia24/
├── frontend/   aplicação React + Vite (todo o site)
└── backend/    API que recebe os leads (a fazer)
```

## Rodar o site

```bash
cd frontend
npm install
npm run dev
```

## Rotas

| Rota | O que é |
|---|---|
| `/` | Home: hero, a rede, unidades, grade de aulas, agendamento |
| `/unidades/alphaville` | Landing page da unidade |
| `/unidades/norte` | Landing page da unidade |
| `/unidades/cambui` | Landing page da unidade |
| `/unidades/lagoa` | Landing page da unidade |
| `/admin/login` · `/admin/dashboard` | Área interna |

## Onde mexer no conteúdo

| Preciso mudar | Arquivo |
|---|---|
| Foto e **WhatsApp** de uma unidade | `frontend/src/unidades.ts` |
| Textos de uma landing page | `frontend/src/pages/unidades/<Unidade>.tsx` |
| Layout das landing pages (as 4 juntas) | `frontend/src/pages/unidades/PaginaUnidade.tsx` e `.css` |
| Seções da home | `frontend/src/pages/home-sections/` |
| Para onde vai o lead | `frontend/src/lib/lead.ts` |

Os números de WhatsApp em `unidades.ts` estão vazios. Enquanto estiverem,
o formulário registra o lead e avisa que a equipe entrará em contato; ao
preencher, os mesmos botões passam a abrir a conversa.

## Publicar na Hostinger

```bash
cd frontend
npm run build
```

Sobe o conteúdo de `frontend/dist/` para a raiz pública. O `.htaccess`
vai junto no build (vem de `frontend/public/`) e é o que faz
`/unidades/alphaville` funcionar ao recarregar a página.
