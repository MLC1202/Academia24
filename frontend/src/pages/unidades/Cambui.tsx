import PaginaUnidade from './PaginaUnidade';
import type { UnidadeData } from './tipos';
import { unidades } from '../../unidades';

const unidade: UnidadeData = {
  brand: '24 Health Club',
  unitName: 'Cambuí',
  region: 'Cambuí · Campinas · SP',
  whatsappMessage:
    'Olá! Vim pela página da Unidade Cambuí e quero conhecer os planos e a condição especial disponível.',
  mapsUrl: 'https://maps.google.com/?q=Rua+Santa+Cruz+299+Cambuí+Campinas',
  slug: 'cambui',
  structureBadge: { value: '1.200', label: 'metros quadrados climatizados' },
  images: {
    hero: unidades.cambui.foto,
    structure: '/unidades/cambui-estrutura.jpg',
    ambiance: '/unidades/cambui-ambiente.jpg',
  },
  hero: {
    eyebrow: 'Premium · Acolhedora · No coração do Cambuí',
    titleLead: 'Treine com conforto.',
    titleAccent: 'Supere seus limites.',
    subtitle:
      'Mais de 1.200 m² climatizados, equipamentos Life Fitness e Hammer Strength, atendimento próximo e serviço de manobrista.',
  },
  quickStats: [
    'Mais de 1.200 m² climatizados',
    'Life Fitness e Hammer Strength',
    'Serviço de manobrista',
    'Rua Santa Cruz, 299',
  ],
  experience: {
    kicker: 'Por que escolher a 24 Cambuí',
    title: 'Seu treino. Seu espaço. Seu momento.',
    description:
      'Uma academia completa, acolhedora e bem equipada para quem busca resultado sem abrir mão de conforto, praticidade e atendimento próximo.',
    features: [
      {
        tag: '+1.200 m²',
        title: 'Ambientes climatizados',
        description:
          'Mais espaço e temperatura agradável para treinar com conforto.',
      },
      {
        tag: 'Premium',
        title: 'Equipamentos premium',
        description:
          'Life Fitness e Hammer Strength para biomecânica e alta performance.',
      },
      {
        tag: 'Valet',
        title: 'Serviço de manobrista',
        description:
          'Chegue, entregue o carro e comece seu treino sem perder tempo.',
      },
      {
        tag: 'Bioimpedância',
        title: 'Avaliação física completa',
        description:
          'Bioimpedância para acompanhar composição corporal, resultados e evolução.',
      },
      {
        tag: 'Atendimento',
        title: 'Premium sem ser impessoal',
        description:
          'Atendimento próximo para você se sentir bem desde a chegada até o fim do treino.',
      },
      {
        tag: 'Aulas',
        title: 'Aulas coletivas',
        description:
          'Mais variedade para movimentar a rotina além da musculação.',
      },
    ],
  },
  structure: {
    kicker: 'Life Fitness + Hammer Strength',
    title: 'Equipamentos que acompanham a sua evolução.',
    description:
      'Marcas premium reconhecidas mundialmente pela biomecânica, segurança, durabilidade e alta performance.',
    bullets: [
      'Movimentos mais naturais e seguros',
      'Estrutura robusta para treinos intensos',
      'Variedade para todos os níveis de treino',
      'Mais de 1.200 m² climatizados no coração do Cambuí',
      'Avaliação física com bioimpedância para acompanhar sua evolução',
    ],
  },
  convenience: {
    kicker: 'A experiência Cambuí',
    title: 'Premium sem ser impessoal.',
    description:
      'Um ambiente climatizado, acolhedor e com atendimento próximo para você se sentir bem desde a chegada até o fim do treino.',
    items: [
      {
        tag: 'Musculação',
        title: 'Sala de musculação completa',
        description:
          'Equipamentos premium para treinar com segurança e variedade.',
      },
      {
        tag: 'Atendimento',
        title: 'Atendimento próximo',
        description:
          'Uma equipe presente para orientar e acompanhar sua rotina.',
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
    title: 'Viva a experiência 24 Cambuí.',
    description:
      'Agende uma aula experimental gratuita, conheça a estrutura e descubra como é treinar em um ambiente completo e acolhedor.',
  },
  testimonials: {
    kicker: 'Quem conhece, recomenda',
    title: 'A experiência dos nossos alunos fala por nós.',
    intro:
      'Inserir aqui a nota oficial do Google e depoimentos autorizados de alunos da unidade Cambuí.',
    items: [
      {
        quote:
          'Inserir uma avaliação verdadeira do Google que destaque estrutura, atendimento e conforto.',
        name: 'Nome do aluno',
        source: 'Avaliação do Google',
      },
      {
        quote:
          'Inserir uma avaliação verdadeira do Google que destaque estrutura, atendimento e conforto.',
        name: 'Nome do aluno',
        source: 'Avaliação do Google',
      },
      {
        quote:
          'Inserir uma avaliação verdadeira do Google que destaque estrutura, atendimento e conforto.',
        name: 'Nome do aluno',
        source: 'Avaliação do Google',
      },
    ],
  },
  campaign: {
    kicker: 'Exclusivo para novos alunos',
    title: 'Comece agora com uma condição especial.',
    description:
      'O espaço ao lado pode receber preço, matrícula grátis, bônus e o número verdadeiro de vagas da campanha.',
    offerTag: 'Condição da campanha',
    offerTitle: 'Oferta por tempo limitado',
    offerDescription:
      'Solicite os valores e escolha entre conhecer a unidade, agendar uma visita ou fazer uma aula experimental.',
  },
  location: {
    kicker: 'No coração do Cambuí',
    title: '24 Health Club Unidade Cambuí.',
    address: ['Rua Santa Cruz, 299', 'Cambuí · Campinas · SP'],
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
        question: 'A academia é climatizada?',
        answer:
          'Sim. A unidade possui ar-condicionado em seus ambientes de treino.',
      },
      {
        question: 'Quais planos estão disponíveis?',
        answer:
          'Fale com a equipe para conhecer as condições vigentes e escolher o plano ideal.',
      },
    ],
  },
  disclaimer:
    'Protótipo comercial · Campanha e contato devem ser atualizados antes da publicação oficial.',
}

function Cambui() {
  return <PaginaUnidade unidade={unidade} />;
}

export default Cambui;
