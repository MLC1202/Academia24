// Aqui ficam os dados das 4 unidades. E o unico lugar que eu edito quando
// muda nome, foto ou link da LP: a home e a grade leem tudo daqui.

export type UnidadeSlug = 'alphaville' | 'norte' | 'cambui' | 'lagoa';

export type UnidadeInfo = {
  nome: string;
  marca: string;
  // Caminho da foto que aparece no card da home.
  // O arquivo fica em frontend/public/unidades/<slug>.jpg.
  // Pra trocar a foto eu apago o arquivo e ponho o novo COM O MESMO NOME —
  // aqui no codigo nao mexo em nada. As que estao la agora sao provisorias.
  foto: string;
  // Link da LP oficial da unidade (as que a dona mandou).
  // Pode colar sem o https:// que o urlAbsoluta la embaixo completa.
  // Se eu deixar vazio, o botao "Conhecer unidade" fica desativado em vez
  // de virar link quebrado.
  lp: string;
};


// Arquivo de public/: o caminho depende de onde o site esta hospedado.
// Na raiz do dominio o BASE_URL e '/', no GitHub Pages e '/Academia24/'.
// Sem isso a foto vira mlc1202.github.io/unidades/x.jpg e da 404.
function caminhoPublico(valor: string) {
  return `${import.meta.env.BASE_URL}${valor.replace(/^\//, '')}`;
}

// Link sem https:// o navegador entende como caminho interno e acaba
// voltando pra home. Entao eu garanto o prefixo aqui.
function urlAbsoluta(valor: string) {
  const limpo = valor.trim();
  if (!limpo) return '';
  return /^https?:\/\//i.test(limpo) ? limpo : `https://${limpo}`;
}

const registro: Record<UnidadeSlug, UnidadeInfo> = {
  alphaville: {
    nome: 'Alphaville',
    marca: '24 Wellness',
    foto: '/unidades/alphaville.jpg',
    lp: 'alphaville.24wellness.com', 
  },
  norte: {
    nome: 'Norte',
    marca: '24 Health Club',
    foto: '/unidades/norte.jpg',
    lp: 'unidadenorte.academia24hclub.com', 
  },
  cambui: {
    nome: 'Cambuí',
    marca: '24 Health Club',
    foto: '/unidades/cambui.jpg',
    lp: 'unidadecambui.academia24hclub.com',
  },
  lagoa: {
    nome: 'Lagoa',
    marca: '24 Health Club',
    foto: '/unidades/lagoa.jpg',
    lp: 'unidadelagoa.academia24hclub.com',
  },
};

// O que o resto do site importa: o mesmo registro, mas com os links de LP
// ja arrumados.
export const unidades = Object.fromEntries(
  Object.entries(registro).map(([slug, info]) => [
    slug,
    { ...info, foto: caminhoPublico(info.foto), lp: urlAbsoluta(info.lp) },
  ]),
) as Record<UnidadeSlug, UnidadeInfo>;

// ['alphaville', 'norte', 'cambui', 'lagoa'] — uso pra percorrer as unidades
// sem repetir a lista.
export const slugsUnidades = Object.keys(registro) as UnidadeSlug[];
