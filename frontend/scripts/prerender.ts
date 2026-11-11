// Roda no fim do "npm run build": grava em dist/ o HTML pronto de cada pagina
// publica, pro Google ler o conteudo sem executar JavaScript. O React assume
// esse HTML no navegador (hydrateRoot em main.tsx).
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SEO } from '../src/data/seo.ts';

const { render } = await import(pathToFileURL('dist-ssr/entry-server.js').href);
const modelo = readFileSync('dist/index.html', 'utf8');
// Rodar de novo sobre um dist/ ja pre-renderizado geraria tudo com a home dentro.
if (!modelo.includes('<div id="root"></div>')) {
  throw new Error('dist/index.html ja esta pre-renderizado: rode "vite build" antes.');
}
const previa = modelo.includes('noindex'); // GitHub Pages: fora do Google

const escapar = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SITE = new URL(modelo.match(/property="og:url" content="([^"]+)"/)![1]).origin;
const BASE = new URL(modelo.match(/property="og:url" content="([^"]+)"/)![1]).pathname;

// arquivo: o .htaccess aponta cada rota pra ele (sem pasta, pra /unidades nao
// virar /unidades/ por redirecionamento do servidor).
const paginas = [
  { caminho: '', arquivo: 'index.html', seo: SEO.inicio },
  { caminho: 'unidades', arquivo: 'unidades.html', seo: SEO.unidades },
  { caminho: 'agendamento', arquivo: 'agendamento.html', seo: SEO.agendamento },
  { caminho: 'duvidas', arquivo: 'duvidas.html', seo: SEO.duvidas },
  // Resposta de endereco inexistente (ErrorDocument 404 no .htaccess).
  { caminho: 'pagina-nao-encontrada', arquivo: '404.html', seo: SEO.naoEncontrada },
];

// /admin: sem pre-render (area interna, nao entra no Google). Raiz vazia.
writeFileSync('dist/app.html', modelo);

for (const { caminho, arquivo, seo } of paginas) {
  const indexar = !('indexar' in seo) || seo.indexar !== false;
  let html = modelo
    .replace(/<title>.*?<\/title>/, `<title>${escapar(seo.titulo)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${escapar(seo.descricao)}"`)
    .replace('<div id="root"></div>', `<div id="root">${render(caminho)}</div>`);
  if (!previa) {
    const extra = indexar
      ? `<link rel="canonical" href="${SITE}${BASE}${caminho}" />`
      : '<meta name="robots" content="noindex" />';
    html = html.replace('</head>', `    ${extra}\n  </head>`);
  }
  writeFileSync(`dist/${arquivo}`, html);
  console.log(`pre-renderizada: ${arquivo} (${html.length} bytes)`);
}
