// Titulo e descricao de cada pagina (aba do navegador e resultado do Google).
// Regra pratica: titulo ate ~60 caracteres, descricao ate ~155 (o Google
// corta o que passar). Sem importacoes: o vite.config.ts tambem le este
// arquivo (index.html e sitemap.xml).
//
// A previa de link no WhatsApp/Instagram/Facebook usa a pagina inicial
// (esses apps nao rodam JavaScript), entao ela vale pro site todo.

export const NOME_SITE = 'Academia 24 Wellness e 24 Health Club';

// Nome curto, pros titulos das paginas internas ficarem em ~60 caracteres.
const MARCAS = '24 Wellness e 24 Health Club';

export type Seo = { titulo: string; descricao: string; indexar?: boolean };

export const SEO = {
  inicio: {
    titulo: 'Academia 24 Wellness Alphaville e 24 Health Club',
    descricao:
      'Academia 24 Wellness em Alphaville (Barueri) e 24 Health Club em São Paulo (Norte) e Campinas (Cambuí e Lagoa). Agende sua aula experimental.',
  },
  unidades: {
    titulo: `Unidades · ${MARCAS}`,
    descricao:
      'Conheça as 4 unidades do 24 Wellness e do 24 Health Club em Barueri, São Paulo e Campinas: endereços, horários, diferenciais e a grade de aulas coletivas.',
  },
  agendamento: {
    titulo: `Agende sua aula experimental · ${MARCAS}`,
    descricao:
      'Escolha a unidade, o período e o seu objetivo. A equipe do 24 Wellness e do 24 Health Club entra em contato para combinar a sua aula experimental, sem compromisso.',
  },
  duvidas: {
    titulo: `Dúvidas frequentes · ${MARCAS}`,
    descricao:
      'Wellhub e TotalPass, avaliação com bioimpedância, aula experimental, planos e estacionamento: respostas para as dúvidas mais comuns do 24 Wellness e do 24 Health Club.',
  },
  naoEncontrada: {
    titulo: `Página não encontrada · ${MARCAS}`,
    descricao: 'Este endereço não existe no site do 24 Wellness e do 24 Health Club.',
    indexar: false,
  },
  admin: {
    titulo: 'Área interna · Rede 24',
    descricao: 'Área interna da Rede 24.',
    indexar: false,
  },
} satisfies Record<string, Seo>;

// LP de cada unidade (/unidades/<slug>). Titulo e descricao vieram das LPs
// antigas (Lovable), pra o Google nao ver o texto mudar na migracao.
// Chave = slug (src/data/slugs.ts); string solta porque este arquivo nao importa nada.
export const SEO_LP: Record<string, Seo> = {
  alphaville: {
    titulo: '24 Wellness Alphaville | Academia premium em Barueri',
    descricao:
      '1.800 m² climatizados, equipamentos Life Fitness e Hammer Strength, manobrista, lojas e massoterapia na Alameda Grajaú, 525 — Alphaville, Barueri.',
  },
  norte: {
    titulo: '24 Health Club Norte — Academia em Vila Guilherme, SP',
    descricao:
      'Mais de 3.000 m², 80+ vagas de estacionamento e abertura às 4h de segunda a sexta. Conheça a unidade Norte do 24 Health Club em Vila Guilherme.',
  },
  cambui: {
    titulo: '24 Health Club Cambuí | Academia premium em Campinas',
    descricao:
      'Mais de 1.200 m² climatizados, equipamentos Life Fitness e Hammer Strength, avaliação física e manobrista no Cambuí, Campinas. Condição especial para novas matrículas.',
  },
  lagoa: {
    titulo: '24 Health Club Lagoa | Academia premium em Campinas',
    descricao:
      'Academia com mais de 1.200 m², equipamentos Life Fitness e Hammer Strength, aulas coletivas e manobrista na Lagoa, Campinas. Condição especial para novas matrículas.',
  },
};
