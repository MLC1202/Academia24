// Aqui ficam os dados das 4 unidades. E o unico lugar que eu edito quando
// muda nome, foto, texto ou link da LP: a pagina de unidades, a subpagina de
// cada uma, a grade e o agendamento leem tudo daqui.

import { SLUGS } from "./slugs";

// "alphaville" | "norte" | "cambui" | "lagoa" -- a lista fica em slugs.ts
// (o sitemap.xml tambem usa). O Record<UnidadeSlug, ...> la embaixo obriga
// os dois arquivos a baterem: faltou ou sobrou unidade = erro de TypeScript.
export type UnidadeSlug = (typeof SLUGS)[number];

export type UnidadeInfo = {
  nome: string;
  marca: string;
  // Logo oficial da marca da unidade, em versao clara (vai em cima da foto).
  // Arquivos em frontend/public/logos/ — vieram do manual e do PDF de logos.
  logo: string;
  // Caminho da foto que aparece no card da home.
  // O arquivo fica em frontend/public/imagens/unidades/<slug>.webp.
  // Pra trocar a foto: abrir a nova no squoosh.app, formato WebP, qualidade
  // 75, lado maior 1600 px, e salvar COM O MESMO NOME (<slug>.webp) por cima
  // da antiga -- aqui no codigo nao mexo em nada. (WebP tem metade do peso
  // do JPG; os originais em JPG ficam so no backup, fora do repositorio.)
  // As que estao la agora sao provisorias.
  foto: string;
  // Link da LP oficial da unidade (as que a dona mandou).
  // Pode colar sem o https:// que o urlAbsoluta la embaixo completa.
  // Se eu deixar vazio, o botao "Conhecer unidade" fica desativado em vez
  // de virar link quebrado.
  lp: string;
  // Link da pagina de planos da unidade. Mesma regra da LP: pode colar sem
  // https://, e se ficar vazio o botao "Ver planos" nem aparece no card.
  planos: string;
  // @ do Instagram da unidade, SEM o "@" e sem link (ex.: "minhaacademia").
  // Se ficar vazio o icone do Instagram nao aparece no card.
  instagram: string;

  // Textos que aparecem no card da unidade (lista e subpagina).
  n: string;
  frase: string;
  descricao: string;
  destaques: string[];
  endereco: string;
  horarios: string;
  local: string;
};

// Arquivo de public/: o caminho depende de onde o site esta hospedado.
// Na raiz do dominio o BASE_URL e '/', no GitHub Pages e '/Academia24/'.
// Sem isso a foto vira mlc1202.github.io/unidades/x.webp e da 404.
function caminhoPublico(valor: string) {
  return `${import.meta.env.BASE_URL}${valor.replace(/^\//, "")}`;
}

// Link sem https:// o navegador entende como caminho interno e acaba
// voltando pra home. Entao eu garanto o prefixo aqui.
function urlAbsoluta(valor: string) {
  const limpo = valor.trim();
  if (!limpo) return "";
  return /^https?:\/\//i.test(limpo) ? limpo : `https://${limpo}`;
}

const registro: Record<UnidadeSlug, UnidadeInfo> = {
  alphaville: {
    nome: "Alphaville",
    marca: "24 Wellness",
    logo: "/logos/24wellness-negativo.svg",
    foto: "/imagens/unidades/alphaville.webp",
    lp: "alphaville.24wellness.com.br",
    planos: "https://vendas.online.sistemapacto.com.br/loja?un=1&k=95115352dc19ba38fc6b7c1f4931700d",
    instagram: "24wellnessacademia",
    n: "01",
    frase: "Conforto, performance e bem-estar.",
    descricao:
      "Loja de roupas fitness, loja de suplementos, massoterapia e ambiente familiar.",
    destaques: [
      "1.800 m²",
      "Life Fitness e Hammer Strength",
      "Ambientes climatizados",
      "Valet",
    ],
    endereco: "Alameda Grajaú, 525 · Alphaville Industrial · Barueri",
    horarios: "Seg–Sex 05h–23h · Sáb 07h–15h · Dom/feriados 08h–14h",
    local: "Barueri · SP",
  },
  norte: {
    nome: "Norte",
    marca: "24 Health Club",
    logo: "/logos/24healthclub-branco.svg",
    foto: "/imagens/unidades/norte.webp",
    lp: "unidadenorte.academia24hclub.com",
    planos: "https://vendas.online.sistemapacto.com.br/loja?un=4&k=95115352dc19ba38fc6b7c1f4931700d", 
    instagram: "academia24healthclub",
    n: "02",
    frase: "Espaço e liberdade para evoluir.",
    descricao:
      "Salão amplo com circulação natural de ar, salas coletivas climatizadas e equipamentos Life Fitness e Technogym.",
    destaques: [
      "Mais de 3.000 m²",
      "Mais de 80 vagas de estacionamento",
      "Mais de 20 anos na região",
      "Abre às 4h de segunda a sexta",
    ],
    endereco: "Rua Maria Cândida, 468 · Vila Guilherme · São Paulo",
    horarios: "Seg–Sex 04h–23h · Sáb 07h–15h · Dom/feriados 08h–14h",
    local: "Vila Guilherme · São Paulo",
  },
  cambui: {
    nome: "Cambuí",
    marca: "24 Health Club",
    logo: "/logos/24healthclub-branco.svg",
    foto: "/imagens/unidades/cambui.webp",
    lp: "unidadecambui.academia24hclub.com",
    planos: "https://vendas.online.sistemapacto.com.br/loja?un=2&k=95115352dc19ba38fc6b7c1f4931700d",
    instagram: "academia24healthclubcampinas", 
    n: "03",
    frase: "Premium sem ser impessoal.",
    descricao:
      "Estrutura acolhedora e climatizada, com novos equipamentos Hack Squat 35° e cadeira abdutora articulada.",
    destaques: [
      "Mais de 1.200 m²",
      "Life Fitness e Hammer Strength",
      "11 anos no Cambuí",
      "Valet",
    ],
    endereco: "Rua Santa Cruz, 299 · Cambuí · Campinas",
    horarios: "Seg–Sex 05h–23h · Sáb 07h–15h · Dom/feriados 08h–14h",
    local: "Campinas · SP",
  },
  lagoa: {
    nome: "Lagoa",
    marca: "24 Health Club",
    logo: "/logos/24healthclub-branco.svg",
    foto: "/imagens/unidades/lagoa.webp",
    lp: "unidadelagoa.academia24hclub.com",
    planos: "https://vendas.online.sistemapacto.com.br/loja?un=3&k=95115352dc19ba38fc6b7c1f4931700d",
    instagram: "academia24healthclubcampinas",
    n: "04",
    frase: "Estrutura à altura dos seus objetivos.",
    descricao:
      "Estrutura completa e uma rotina de treino com conforto, orientação e praticidade.",
    destaques: [
      "Musculação completa",
      "Área de cardio",
      "Aulas coletivas",
      "Avaliação com bioimpedância",
    ],
    endereco: "Av. Dr. Heitor Penteado, 1740 · Campinas",
    horarios: "Consulte a unidade para confirmar os horários vigentes.",
    local: "Campinas · SP",
  },
};

// O que o resto do site importa: o mesmo registro, mas com os links de LP
// e de planos ja arrumados.
export const unidades = Object.fromEntries(
  Object.entries(registro).map(([slug, info]) => [
    slug,
    {
      ...info,
      foto: caminhoPublico(info.foto),
      logo: caminhoPublico(info.logo),
      lp: urlAbsoluta(info.lp),
      planos: urlAbsoluta(info.planos),
    },
  ])
) as Record<UnidadeSlug, UnidadeInfo>;

// ['alphaville', 'norte', 'cambui', 'lagoa'] — uso pra percorrer as unidades
// sem repetir a lista.
export const slugsUnidades = Object.keys(registro) as UnidadeSlug[];

// Confere se um pedaco da URL (/unidades/<slug>) e uma unidade de verdade.
export function ehSlugUnidade(valor: string | undefined): valor is UnidadeSlug {
  return !!valor && valor in registro;
}