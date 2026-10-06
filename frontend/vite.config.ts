import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, searchForWorkspaceRoot, type Plugin } from 'vite'
import { DOMINIOS_QUE_REDIRECIONAM, SITE_URL } from './src/data/site.ts'
import { NOME_SITE, SEO } from './src/data/seo.ts'

// Config do Vite — docs em vite.dev/config
//
// base: na Hostinger o site fica na raiz do dominio ('/'), mas no GitHub
// Pages ele fica em /Academia24/. O workflow de deploy passa BASE_PATH;
// build local continua na raiz, sem precisar lembrar de nada.

// Paginas publicas que entram no sitemap.xml (admin e 404 ficam de fora).
// (As paginas /unidades/<slug> sairam em 01/10/2026: tudo fica em /unidades.)
const ROTAS_PUBLICAS = ['', 'unidades', 'agendamento', 'duvidas']

// Regra do .htaccess que manda pro endereco oficial (https + dominio principal):
//  - qualquer acesso por http (sem cadeado) -> https;
//  - os outros dominios (e o principal com/sem www) -> dominio principal.
// Um pulo so, sempre pro SITE_URL (nunca pro Host que o visitante mandou).
// Entra no lugar do marcador do public/.htaccess.
// /.well-known/ fica de fora: a Hostinger usa pra emitir o SSL de cada dominio.
function regraDeDominios(origem: string): string {
  const principal = new URL(origem).host
  const semWww = principal.replace(/^www\./, '')
  const outros = [
    principal.startsWith('www.') ? semWww : `www.${principal}`,
    ...DOMINIOS_QUE_REDIRECIONAM.flatMap((d) => [d, `www.${d}`]),
  ]
  const conds = outros
    .map((h, i) => `  RewriteCond %{HTTP_HOST} ^${h.replace(/\./g, '\\.')}$ [NC${i < outros.length - 1 ? ',OR' : ''}]`)
    .join('\n')
  return [
    '<IfModule mod_rewrite.c>',
    '  RewriteEngine On',
    // THE_REQUEST = o pedido ORIGINAL (o REQUEST_URI vira /index.html quando
    // o arquivo nao existe e a pagina 404 entra, e ai escaparia do filtro).
    '  RewriteCond %{THE_REQUEST} !\\s/\\.well-known/',
    '  RewriteCond %{HTTPS} off [OR]',
    conds,
    `  RewriteRule ^ ${origem}%{REQUEST_URI} [R=301,L]`,
    '</IfModule>',
  ].join('\n')
}

const escapar = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// SEO na hora do build:
//  - index.html: titulo, descricao e previa de link (Open Graph) da home;
//  - robots.txt: libera o site e bloqueia /admin e /api;
//  - sitemap.xml: todas as paginas publicas.
// O dominio vem de src/data/site.ts. Previa do GitHub Pages (VITE_SEM_API=1):
// usa o endereco do Pages e fica FORA do Google (noindex + robots bloqueando).
function seo(): Plugin {
  let base = '/'
  let origem = ''
  let previa = false
  let build = false

  return {
    name: 'seo',
    configResolved(config) {
      base = config.base
      build = config.command === 'build'
      previa = config.env.VITE_SEM_API === '1'
      origem = !build
        ? 'http://localhost:5173'
        : previa
          ? 'https://mlc1202.github.io'
          : SITE_URL.trim().replace(/\/+$/, '')
      if (build && !previa && !/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(origem)) {
        throw new Error(
          '\n\n  SITE_URL vazio ou invalido em frontend/src/data/site.ts.\n' +
            '  Preencha com o dominio do site (ex.: "https://www.academia24hclub.com")\n' +
            '  antes do build de producao: sitemap.xml, robots.txt e a previa de link\n' +
            '  dependem dele.\n',
        )
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const site = `${origem}${base}` // termina com "/"
        let saida = html
          .replaceAll('__SEO_TITULO__', escapar(SEO.inicio.titulo))
          .replaceAll('__SEO_DESCRICAO__', escapar(SEO.inicio.descricao))
          .replaceAll('__SEO_NOME__', escapar(NOME_SITE))
          .replaceAll('__SEO_SITE__', site)
        if (previa) {
          // data-fixo: o useSeo nao tira este noindex.
          saida = saida.replace('</head>', '    <meta name="robots" content="noindex" data-fixo="1" />\n  </head>')
        }
        return saida
      },
    },
    // Depois que o Vite copiou o public/ pro dist/: troca o marcador do
    // .htaccess pela regra dos dominios (so no build de producao).
    writeBundle(opcoes) {
      if (!build || previa) return
      const arquivo = join(opcoes.dir ?? 'dist', '.htaccess')
      const marcador = '# @@REDIRECIONAMENTO_DE_DOMINIOS@@'
      const htaccess = readFileSync(arquivo, 'utf8')
      if (!htaccess.includes(marcador)) throw new Error(`marcador "${marcador}" sumiu do public/.htaccess`)
      writeFileSync(arquivo, htaccess.replace(marcador, regraDeDominios(origem)))
    },
    generateBundle() {
      if (!build) return
      const site = `${origem}${base}`
      const robots = previa
        ? 'User-agent: *\nDisallow: /\n'
        : `User-agent: *\nAllow: /\nDisallow: ${base}admin\nDisallow: ${base}api/\n\nSitemap: ${site}sitemap.xml\n`
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      if (previa) return
      const hoje = new Date().toISOString().slice(0, 10)
      const urls = ROTAS_PUBLICAS.map(
        (r) => `  <url>\n    <loc>${site}${r}</loc>\n    <lastmod>${hoje}</lastmod>\n  </url>`,
      ).join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
    },
  }
}

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), seo()],
  // Em dev, /api vai pro PHP do Docker (backend/docker-compose.yml).
  // Em producao nao precisa: front e API ficam no mesmo dominio.
  server: {
    proxy: { '/api': 'http://localhost:8080' },
    // O dev server so entrega arquivos de dentro do frontend/. Libera UM
    // arquivo do backend (a grade de exemplo, importada no data/grade.ts),
    // e nao a pasta toda: o backend/.env fica fora do alcance.
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), '../backend/sql/seeds/grade-exemplo.json'],
    },
  },
})
