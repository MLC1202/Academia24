// Troca o titulo da aba e a descricao (meta description) quando a pagina
// abre. O Google roda JavaScript e le esses valores; o index.html ja vem
// com os da pagina inicial (pra quem nao roda JS).
//
// indexar: false -> <meta name="robots" content="noindex"> (404, admin).

import { useEffect } from 'react';
import type { Seo } from '../data/seo';

function meta(nome: string): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${nome}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = nome;
    document.head.appendChild(el);
  }
  return el;
}

export function useSeo({ titulo, descricao, indexar = true }: Seo) {
  useEffect(() => {
    document.title = titulo;
    meta('description').content = descricao;
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    // A previa do GitHub Pages ja vem com noindex no index.html: nao mexe.
    if (robots?.dataset.fixo) return;
    if (indexar) robots?.remove();
    else meta('robots').content = 'noindex';
  }, [titulo, descricao, indexar]);
}
