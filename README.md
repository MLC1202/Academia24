# Academia 24

Site da Rede 24 — home institucional com as quatro unidades. As landing
pages de cada unidade são as oficiais da rede (links externos), não fazem
parte deste projeto.

```
academia24/
├── frontend/   aplicação React + Vite (todo o site)
└── backend/    API da grade de aulas (a fazer)
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
| `/admin/login` · `/admin/dashboard` | Área interna (edição da grade) |

## Onde mexer no conteúdo

| Preciso mudar | Arquivo |
|---|---|
| **Link da LP** de uma unidade | `frontend/src/unidades.ts` |
| **Foto** de uma unidade | trocar o arquivo `frontend/public/unidades/<slug>.jpg` (mesmo nome) |
| **Vídeo do hero** | trocar `frontend/public/hero.mp4` e `hero-poster.jpg` (mesmos nomes) — spec no topo do `Hero.tsx` |
| Seções da home | `frontend/src/pages/home-sections/` |
| Grade de aulas padrão | `frontend/src/grade.ts` |
| Formulário de agendamento | `frontend/src/components/Agendamento.tsx` |

Os links de LP em `unidades.ts` estão vazios. Enquanto estiverem, os
botões "Conhecer unidade" e "Consultar esta unidade" ficam desativados;
ao preencher, passam a abrir a LP da unidade em uma nova aba.

## Publicar na Hostinger

```bash
cd frontend
npm run build
```

Sobe o conteúdo de `frontend/dist/` para a raiz pública. O `.htaccess`
vai junto no build (vem de `frontend/public/`) e é o que faz as rotas do
site funcionarem ao recarregar a página.
