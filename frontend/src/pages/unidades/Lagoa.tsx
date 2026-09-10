import PaginaUnidade from './PaginaUnidade';
import type { UnidadeData } from './tipos';
import { unidades } from '../../unidades';

const unidade: UnidadeData = {
  brand: '24 Health Club',
  unitName: 'Lagoa',
  region: 'Lagoa · Campinas · SP',
  whatsappMessage:
    'Olá! Vim pela página da Unidade Lagoa e quero conhecer os planos e a condição especial disponível.',
  mapsUrl:
    'https://maps.google.com/?q=Avenida+Doutor+Heitor+Penteado+1740+Lagoa+Campinas',
  slug: 'lagoa',
  structureBadge: { value: '1.200', label: 'metros quadrados' },
  images: {
    hero: unidades.lagoa.foto,
    structure: '/unidades/lagoa-estrutura.jpg',
    ambiance: '/unidades/lagoa-ambiente.jpg',
  },
  hero: {
    eyebrow: 'Estrutura premium em Campinas',
    titleLead: 'Seu treino merece uma estrutura',
    titleAccent: 'à altura dos seus objetivos.',
    subtitle:
      'Mais de 1.200 m², equipamentos Life Fitness e Hammer Strength, aulas coletivas, vestiários completos e serviço de manobrista.',
  },
  quickStats: [
    'Mais de 1.200 m² de estrutura',
    'Equipamentos internacionais premium',
    '05h às 23h de segunda a sexta',
    'Av. Doutor Heitor Penteado, 1740',
  ],
  experience: {
    kicker: 'Por que escolher a 24 Lagoa',
    title: 'Mais do que uma academia. Uma experiência completa.',
    description:
      'Estrutura, comodidade e acompanhamento para o treino caber na sua rotina.',
    features: [
      {
        tag: '1.200 m²',
        title: 'Mais espaço para treinar',
        description:
          'Mais espaço para treinar com conforto e sem sensação de lotação.',
      },
      {
        tag: 'Premium',
        title: 'Padrão premium',
        description:
          'Life Fitness e Hammer Strength para biomecânica e alta performance.',
      },
      {
        tag: 'Valet',
        title: 'Chegue e treine',
        description:
          'Serviço de manobrista para você não perder tempo procurando vaga.',
      },
      {
        tag: 'Bioimpedância',
        title: 'Avaliação física completa',
        description:
          'Bioimpedância para acompanhar composição corporal, resultados e evolução.',
      },
      {
        tag: 'Aulas',
        title: 'Aulas coletivas',
        description:
          'Variedade de aulas para movimentar a rotina além da musculação.',
      },
      {
        tag: 'Vestiários',
        title: 'Vestiários completos',
        description:
          'Estrutura pensada para você treinar e seguir o dia com praticidade.',
      },
    ],
  },
  structure: {
    kicker: 'Life Fitness + Hammer Strength',
    title: 'Performance começa pelo equipamento certo.',
    description:
      'Marcas premium reconhecidas mundialmente pela biomecânica, segurança, durabilidade e sensação de treino com peso livre.',
    bullets: [
      'Movimentos mais naturais e seguros',
      'Equipamentos robustos para treinos intensos',
      'Variedade para evoluir sem cair na rotina',
      'Mais de 1.200 m² de estrutura em Campinas',
      'Avaliação física com bioimpedância para acompanhar sua evolução',
    ],
  },
  convenience: {
    kicker: 'Conheça a unidade',
    title: 'Uma academia feita para você querer voltar.',
    description:
      'Sala de musculação, equipamentos premium, aulas coletivas e vestiários completos em uma estrutura pensada para a sua rotina.',
    items: [
      {
        tag: 'Musculação',
        title: 'Sala de musculação',
        description:
          'Ambiente amplo e organizado para treinar com liberdade.',
      },
      {
        tag: 'Aulas',
        title: 'Aulas coletivas',
        description: 'Mais variedade para movimentar a sua semana.',
      },
      {
        tag: 'Valet',
        title: 'Serviço de manobrista',
        description: 'Mais comodidade para chegar e começar o treino.',
      },
    ],
  },
  trial: {
    kicker: 'Conheça antes de decidir',
    title: 'Viva a experiência 24 Lagoa.',
    description:
      'Agende uma aula experimental gratuita, conheça a estrutura e converse com nossa equipe sobre o plano ideal para sua rotina.',
  },
  testimonials: {
    kicker: 'Quem conhece, recomenda',
    title: 'A experiência dos nossos alunos fala por nós.',
    intro:
      'Área reservada para a nota real do Google. Os depoimentos reais devem ser conectados aqui antes da publicação final.',
    items: [
      {
        quote:
          'Inserir uma avaliação verdadeira do Google que destaque estrutura, equipamentos e atendimento.',
        name: 'Nome do aluno',
        source: 'Avaliação do Google',
      },
      {
        quote:
          'Inserir uma avaliação verdadeira do Google que destaque estrutura, equipamentos e atendimento.',
        name: 'Nome do aluno',
        source: 'Avaliação do Google',
      },
      {
        quote:
          'Inserir uma avaliação verdadeira do Google que destaque estrutura, equipamentos e atendimento.',
        name: 'Nome do aluno',
        source: 'Avaliação do Google',
      },
    ],
  },
  campaign: {
    kicker: 'Exclusivo para novos alunos',
    title: 'Conheça a 24 Lagoa com uma condição especial.',
    description:
      'Este é o espaço para inserir preço promocional, matrícula grátis, bônus e a quantidade real de vagas.',
    offerTag: 'Condição da campanha',
    offerTitle: 'Oferta por tempo limitado',
    offerDescription:
      'Solicite os valores pelo WhatsApp e escolha entre conhecer a estrutura, agendar uma visita ou fazer uma aula experimental.',
  },
  location: {
    kicker: 'Estamos perto de você',
    title: '24 Health Club Unidade Lagoa.',
    address: ['Av. Doutor Heitor Penteado, 1740', 'Lagoa · Campinas · SP'],
    schedule: [
      { label: 'Segunda a sexta', hours: '05h às 23h' },
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
        question: 'Posso fazer uma aula experimental?',
        answer:
          'Sim. Solicite o agendamento pelo WhatsApp e confirme a disponibilidade.',
      },
      {
        question: 'A unidade possui estacionamento?',
        answer:
          'A unidade oferece serviço de manobrista para mais comodidade.',
      },
      {
        question: 'Quais planos estão disponíveis?',
        answer:
          'Fale com a equipe para conhecer as condições vigentes e encontrar o plano ideal.',
      },
    ],
  },
  disclaimer:
    'Protótipo comercial · Campanha e contato devem ser atualizados antes da publicação oficial.',
}

function Lagoa() {
  return <PaginaUnidade unidade={unidade} />;
}

export default Lagoa;
