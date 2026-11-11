// Usado so no build (scripts/prerender.ts): devolve o HTML de uma pagina.

import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { Rotas } from './App.tsx';

export function render(caminho: string) {
  const base = import.meta.env.BASE_URL;
  return renderToString(
    <StaticRouter location={base + caminho.replace(/^\//, '')} basename={base}>
      <Rotas />
    </StaticRouter>,
  );
}
