# Academia 24

Site da Rede 24 — home institucional com as quatro unidades. As landing
pages de cada unidade são as oficiais da rede (links externos), não fazem
parte deste projeto.

```
academia24/
├── frontend/   aplicação React + Vite (todo o site)
└── backend/    API em PHP + MariaDB (ver backend/README.md)
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
| `/` | Home: hero, a rede, bioimpedância, próximo passo |
| `/unidades` | As 4 unidades + grade de aulas |
| `/unidades/<slug>` | Uma unidade (ex.: `/unidades/alphaville`) + grade só dela |
| `/agendamento` | Formulário da aula experimental (aceita `?unidade=<slug>`) |
| `/duvidas` | Perguntas frequentes |
| `/admin/login` · `/admin/dashboard` | Área interna (edição da grade) |

## Estrutura do front

```
frontend/src/
├── main.tsx            ponto de entrada
├── App.tsx             rotas
├── styles/global.css   cores, fontes e base
├── data/
│   ├── unidades.ts     nome, textos, foto e LP de cada unidade
│   └── grade.ts        modelo e grade padrão das aulas
├── lib/grade-store.ts  onde a grade é lida/salva (hoje localStorage)
├── components/         peças usadas em várias páginas
│   ├── Header/         cabeçalho (menu + trilha de volta)
│   ├── Footer/         rodapé padrão
│   └── Pagina/         casca das páginas internas (scroll + footer)
└── pages/              uma pasta por página
    ├── home/           HomePage + sections/ (Hero, Rede, Bioimpedancia, Convite)
    ├── unidades/       UnidadesPage, UnidadePage + components/ (lista, card, grade)
    ├── agendamento/    AgendamentoPage + FormAgendamento
    ├── duvidas/        DuvidasPage
    └── admin/          LoginPage, DashboardPage
```

## Arquivos estáticos (fotos e vídeo)

Tudo que é mídia fica em `frontend/public/` e vai para o build do jeito que
está. Para trocar, basta substituir o arquivo mantendo o mesmo nome.

```
frontend/public/
├── .htaccess          rotas do site na Hostinger (não mover)
├── imagens/
│   ├── hero-poster.jpg
│   ├── duvidas.jpg
│   ├── rede/          estrutura.jpg, equipamentos.jpg
│   └── unidades/      alphaville.jpg, norte.jpg, cambui.jpg, lagoa.jpg
└── videos/
    └── hero.mp4
```

## Onde mexer no conteúdo

| Preciso mudar | Arquivo |
|---|---|
| **Link da LP** ou **textos** de uma unidade | `frontend/src/data/unidades.ts` |
| **Foto** de uma unidade | trocar o arquivo `frontend/public/imagens/unidades/<slug>.jpg` (mesmo nome) |
| **Vídeo do hero** | trocar `frontend/public/videos/hero.mp4` e `frontend/public/imagens/hero-poster.jpg` (mesmos nomes) — spec no topo do `Hero.tsx` |
| Fotos da seção A Rede e da página Dúvidas | `frontend/public/imagens/rede/` e `frontend/public/imagens/duvidas.jpg` (mesmos nomes) |
| Seções da home | `frontend/src/pages/home/sections/` |
| Menu e trilha de volta | `frontend/src/components/Header/Header.tsx` |
| Perguntas frequentes | `frontend/src/pages/duvidas/DuvidasPage.tsx` |
| Grade de aulas padrão | `frontend/src/data/grade.ts` |
| Formulário de agendamento | `frontend/src/pages/agendamento/FormAgendamento.tsx` |

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
