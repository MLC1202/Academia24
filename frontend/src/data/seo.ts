// Titulo e descricao de cada pagina (aba do navegador e resultado do Google).
// Regra pratica: titulo ate ~60 caracteres, descricao ate ~155 (o Google
// corta o que passar). Sem importacoes: o vite.config.ts tambem le este
// arquivo (index.html e sitemap.xml).
//
// A previa de link no WhatsApp/Instagram/Facebook usa a pagina inicial
// (esses apps nao rodam JavaScript), entao ela vale pro site todo.

export const NOME_SITE = 'Rede 24';

export type Seo = { titulo: string; descricao: string; indexar?: boolean };

export const SEO = {
  inicio: {
    titulo: 'Rede 24 · Academias em São Paulo, Barueri e Campinas',
    descricao:
      'Quatro academias completas: 24 Wellness Alphaville e 24 Health Club Norte, Cambuí e Lagoa. Agende sua aula experimental, sem compromisso.',
  },
  unidades: {
    titulo: 'Unidades · Rede 24',
    descricao:
      'Conheça as 4 unidades da Rede 24 em Barueri, São Paulo e Campinas: endereços, horários, diferenciais e a grade de aulas coletivas de cada uma.',
  },
  agendamento: {
    titulo: 'Agende sua aula experimental · Rede 24',
    descricao:
      'Escolha a unidade, o período e o seu objetivo. A equipe da Rede 24 entra em contato para combinar a sua aula experimental, sem compromisso.',
  },
  duvidas: {
    titulo: 'Dúvidas frequentes · Rede 24',
    descricao:
      'Wellhub e TotalPass, avaliação com bioimpedância, aula experimental, planos e estacionamento: respostas para as dúvidas mais comuns da Rede 24.',
  },
  naoEncontrada: {
    titulo: 'Página não encontrada · Rede 24',
    descricao: 'Este endereço não existe no site da Rede 24.',
    indexar: false,
  },
  admin: {
    titulo: 'Área interna · Rede 24',
    descricao: 'Área interna da Rede 24.',
    indexar: false,
  },
} satisfies Record<string, Seo>;
