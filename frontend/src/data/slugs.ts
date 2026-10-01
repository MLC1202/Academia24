// Os enderecos das 4 unidades (/unidades/<slug>). Fica num arquivo sem
// nenhuma importacao porque o vite.config.ts tambem le (pra montar o
// sitemap.xml). Os dados de cada uma ficam em unidades.ts.
export const SLUGS = ['alphaville', 'norte', 'cambui', 'lagoa'] as const;
