import PaginaUnidade from './PaginaUnidade';
import type { UnidadeData } from './tipos';
import { unidades } from '../../unidades';

const unidade: UnidadeData = {
  brand: '24 Health Club',
  unitName: 'Norte',
  region: 'Vila Guilherme · São Paulo · SP',
  whatsappMessage:
    'Olá! Vim pela página da Unidade Norte e quero conhecer os planos e a condição especial disponível.',
  mapsUrl: 'https://maps.google.com/?q=Rua+Maria+Cândida+468+Vila+Guilherme+São+Paulo',
  slug: 'norte',
  structureBadge: { value: '3.000+', label: 'metros quadrados' },
  images: {
    hero: unidades.norte.foto,
    structure: '/unidades/norte-estrutura.jpg',
    ambiance: '/unidades/norte-ambiente.jpg',
  },
  hero: {
    eyebrow: 'Espaço · Variedade · Liberdade de horário',
    titleLead: 'Mais espaço para treinar.',
    titleAccent: 'Mais liberdade para evoluir.',
    subtitle:
      'Mais de 3.000 m², estacionamento com mais de 80 vagas, variedade de treinos e abertura às 4h de segunda a sexta.',
  },
  quickStats: [
    'Mais de 3.000 m² de estrutura',
    'Mais de 80 vagas de estacionamento',
    'Abertura às 4h de segunda a sexta',
    'Rua Maria Cândida, 468',
  ],
  experience: {
    kicker: 'A experiência 24 Norte',
    title: 'Ampla. Completa. Pronta para o seu treino.',
    description:
      'Mais de 3.000 m² de estrutura, grandes áreas de treino, circulação natural de ar e mais de duas décadas fazendo parte da rotina da Zona Norte.',
    features: [
      {
        tag: '3.000 m²+',
        title: 'Uma das maiores estruturas da região',
        description:
          'Grandes áreas para musculação, cardio e diferentes experiências de treino.',
      },
      {
        tag: '+80 vagas',
        title: 'Estacionamento amplo',
        description:
          'Mais praticidade para chegar, estacionar e começar o treino.',
      },
      {
        tag: '+20 anos',
        title: 'Tradição na região',
        description:
          'Mais de duas décadas fazendo parte da rotina da Vila Guilherme e Zona Norte.',
      },
      {
        tag: '04h',
        title: 'Abertura antecipada nos dias úteis',
        description:
          'De segunda a sexta, a unidade abre às 4h e funciona até as 23h.',
      },
      {
        tag: 'Premium',
        title: 'Life Fitness e Technogym',
        description:
          'Parque diversificado de equipamentos para treinos completos e seguros.',
      },
      {
        tag: 'Aulas',
        title: 'Aulas coletivas em salas climatizadas',
        description:
          'Mais opções para movimentar a rotina, além da musculação e do cardio.',
      },
      {
        tag: 'Bioimpedância',
        title: 'Avaliação física completa',
        description:
          'Acompanhe composição corporal, percentual de gordura, massa muscular e evolução.',
      },
    ],
  },
  structure: {
    kicker: 'Arquitetura que favorece seu treino',
    title: 'Um salão amplo, com luz e circulação natural de ar.',
    description:
      'O pé-direito alto e a construção aberta proporcionam uma sensação de liberdade e conforto durante o treino de musculação e cardio.',
    bullets: [
      'Grandes áreas para musculação e cardio',
      'Avaliação física com bioimpedância para acompanhar sua evolução',
      'Circulação natural proporcionada pela construção',
      'Parque diversificado, incluindo Life Fitness e Technogym',
      'Abertura às 4h de segunda a sexta, para treinar antes do trabalho',
    ],
  },
  convenience: {
    kicker: 'Muito além da musculação',
    title: 'Mais opções para movimentar sua rotina.',
    description:
      'Aulas coletivas, salas climatizadas, mercado autônomo e mais de 80 vagas de estacionamento para tornar sua experiência mais prática.',
    items: [
      {
        tag: 'Aulas',
        title: 'Aulas coletivas',
        description: 'Salas climatizadas e variedade de aulas ao longo do dia.',
      },
      {
        tag: 'Mercado',
        title: 'Mercado autônomo',
        description:
          'Bebidas e snacks na própria unidade, sem sair do seu ritmo.',
      },
      {
        tag: 'Vagas',
        title: 'Mais de 80 vagas',
        description: 'Estacionamento amplo para chegar e começar o treino.',
      },
    ],
  },
  trial: {
    kicker: 'Conheça antes de decidir',
    title: 'Venha viver a experiência 24 Norte.',
    description:
      'Conheça a estrutura, converse com nossa equipe e faça uma aula experimental gratuita antes de escolher seu plano.',
  },
  testimonials: {
    kicker: 'Quem treina, recomenda',
    title: 'Espaço, comunidade e apoio para evoluir.',
    intro:
      'Inserir aqui a nota oficial do Google e depoimentos autorizados de alunos da unidade Norte.',
    items: [
      {
        quote:
          'Inserir uma avaliação verdadeira do Google que destaque espaço, atendimento e variedade de treinos.',
        name: 'Nome do aluno',
        source: 'Avaliação do Google',
      },
      {
        quote:
          'Inserir uma avaliação verdadeira do Google que destaque espaço, atendimento e variedade de treinos.',
        name: 'Nome do aluno',
        source: 'Avaliação do Google',
      },
      {
        quote:
          'Inserir uma avaliação verdadeira do Google que destaque espaço, atendimento e variedade de treinos.',
        name: 'Nome do aluno',
        source: 'Avaliação do Google',
      },
    ],
  },
  campaign: {
    kicker: 'Exclusivo para novos alunos',
    title: 'Comece agora com uma condição especial.',
    description:
      'Este espaço pode receber o preço promocional, matrícula grátis, bônus e a quantidade real de vagas da campanha.',
    offerTag: 'Condição da campanha',
    offerTitle: 'Oferta por tempo limitado',
    offerDescription:
      'Solicite os valores, agende uma visita ou venha fazer uma aula experimental.',
  },
  location: {
    kicker: 'Vila Guilherme · São Paulo',
    title: '24 Health Club Unidade Norte.',
    address: ['Rua Maria Cândida, 468', 'Vila Guilherme · São Paulo · SP'],
    schedule: [
      { label: 'Segunda a sexta', hours: '04h às 23h' },
      { label: 'Sábado', hours: '07h às 15h' },
      { label: 'Domingos e feriados', hours: '08h às 14h' },
    ],
  },
  faq: {
    title: 'Dúvidas frequentes.',
    items: [
      {
        question: 'A unidade oferece avaliação física?',
        answer:
          'Sim. Oferecemos avaliação física com bioimpedância para acompanhar composição corporal e evolução.',
      },
      {
        question: 'O salão de musculação possui ar-condicionado?',
        answer:
          'O salão é amplo e possui circulação natural de ar. O ar-condicionado está disponível nas salas de aulas coletivas.',
      },
      {
        question: 'Quais marcas de equipamentos existem?',
        answer:
          'A unidade possui um parque diversificado, incluindo equipamentos Life Fitness, Technogym e outras marcas.',
      },
      {
        question: 'Há estacionamento?',
        answer:
          'Sim. A unidade conta com estacionamento amplo, com mais de 80 vagas.',
      },
    ],
  },
  disclaimer:
    'Protótipo comercial · Campanha e contato devem ser atualizados antes da publicação oficial.',
}

function Norte() {
  return <PaginaUnidade unidade={unidade} />;
}

export default Norte;
