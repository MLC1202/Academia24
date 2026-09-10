import PaginaUnidade from './PaginaUnidade';
import type { UnidadeData } from './tipos';
import { unidades } from '../../unidades';

const unidade: UnidadeData = {
  brand: '24 Wellness',
  unitName: 'Alphaville',
  region: 'Alphaville Industrial · Barueri · SP',
  whatsappMessage:
    'Olá! Vim pela página da Unidade Alphaville e quero conhecer os planos e condições disponíveis.',
  mapsUrl: 'https://maps.google.com/?q=Alameda+Grajaú+525+Alphaville+Industrial+Barueri',
  slug: 'alphaville',
  structureBadge: { value: '1.800', label: 'metros quadrados' },
  images: {
    hero: unidades.alphaville.foto,
    structure: '/unidades/alphaville-estrutura.jpg',
    ambiance: '/unidades/alphaville-ambiente.jpg',
  },
  hero: {
    eyebrow: 'Estrutura · Conforto · Resultado',
    titleLead: 'Treinar bem também é treinar com',
    titleAccent: 'conforto.',
    subtitle:
      '1.800 m², equipamentos Life Fitness e Hammer Strength, ambientes climatizados e uma experiência acolhedora no coração de Alphaville.',
  },
  quickStats: [
    '1.800 m² de estrutura',
    'Life Fitness e Hammer Strength',
    'Ambiente familiar',
    'Alameda Grajaú, 525',
  ],
  experience: {
    kicker: 'A experiência 24 Wellness',
    title: 'Uma estrutura completa para uma rotina que pede mais.',
    description:
      'Na Unidade Alphaville, cada detalhe foi pensado para unir performance, praticidade e bem-estar. São 1.800 m², equipamentos de alto padrão e um ambiente familiar e acolhedor — do momento em que você chega até o final do seu treino.',
    features: [
      {
        tag: '1.800 m²',
        title: 'Espaço para treinar com liberdade',
        description:
          'Ambientes amplos e setores organizados para uma rotina mais confortável.',
      },
      {
        tag: 'Premium',
        title: 'Life Fitness e Hammer Strength',
        description:
          'Equipamentos de alto padrão para treinos mais completos, seguros e eficientes.',
      },
      {
        tag: 'Clima',
        title: 'Academia climatizada',
        description:
          'Conforto térmico em todos os ambientes para você manter o foco no treino.',
      },
      {
        tag: 'Valet',
        title: 'Serviço de manobrista',
        description:
          'Mais praticidade para chegar, estacionar e começar o treino.',
      },
      {
        tag: 'Conveniência',
        title: 'Tudo o que você precisa em um só lugar',
        description:
          'Loja de roupas fitness, loja de suplementos e serviço de massoterapia na unidade.',
      },
      {
        tag: 'Família',
        title: 'Ambiente familiar e acolhedor',
        description:
          'Um espaço agradável, com atendimento próximo, para você e sua família se sentirem bem.',
      },
      {
        tag: 'Bioimpedância',
        title: 'Avaliação física completa',
        description:
          'Acompanhe sua evolução com dados sobre composição corporal, percentual de gordura, massa muscular e outros indicadores.',
      },
    ],
  },
  structure: {
    kicker: 'Espaço que acompanha seu ritmo',
    title: 'Liberdade para treinar do seu jeito.',
    description:
      'Uma academia ampla, climatizada e equipada com Life Fitness e Hammer Strength para você construir uma rotina consistente e evoluir com conforto.',
    bullets: [
      '1.800 m² com áreas amplas para musculação e cardio',
      'Equipamentos Life Fitness e Hammer Strength',
      'Avaliação física com bioimpedância para acompanhar sua evolução',
      'Ambientes organizados, climatizados e familiares',
      'Equipe próxima durante toda a sua experiência',
    ],
  },
  convenience: {
    kicker: 'Praticidade desde a chegada',
    title: 'Bem-estar dentro e fora do treino.',
    description:
      'Conte com facilidades que tornam sua rotina mais prática e completa, em um ambiente familiar preparado para cuidar de você.',
    items: [
      {
        tag: 'Lojas',
        title: 'Roupas fitness e suplementos',
        description: 'Disponíveis na própria unidade, sem sair do seu ritmo.',
      },
      {
        tag: 'Massoterapia',
        title: 'Cuidado e recuperação',
        description:
          'Serviço de massoterapeuta para complementar seu cuidado e recuperação.',
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
    title: 'Viva a experiência 24 Wellness.',
    description:
      'Agende uma aula experimental gratuita, conheça os ambientes e converse com nossa equipe sobre o plano que combina com sua rotina.',
  },
  testimonials: {
    kicker: 'Confiança para começar',
    title: 'Uma academia feita para fazer parte da sua rotina.',
    intro:
      'Avaliações reais dos alunos podem entrar aqui para transformar experiência em confiança e ajudar novos visitantes a decidir.',
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
    title: 'Comece agora com a condição vigente da unidade.',
    description:
      'Use este espaço para comunicar a campanha real: preço, benefício, validade e quantidade verdadeira de vagas.',
    offerTag: 'Condição da campanha',
    offerTitle: 'Consulte planos e valores',
    offerDescription:
      'Receba as opções disponíveis e agende sua visita sem compromisso.',
  },
  location: {
    kicker: 'Alphaville Industrial · Barueri',
    title: 'No coração de Alphaville.',
    address: ['Alameda Grajaú, 525', 'Alphaville Industrial · Barueri · SP'],
    schedule: [
      { label: 'Segunda a sexta', hours: '05h às 23h' },
      { label: 'Sábado', hours: '07h às 15h' },
      { label: 'Domingos e feriados', hours: '08h às 14h' },
    ],
  },
  faq: {
    title: 'Antes de começar.',
    items: [
      {
        question: 'A academia é climatizada?',
        answer:
          'Sim. Todos os ambientes da unidade são climatizados para garantir conforto térmico durante todo o seu treino.',
      },
      {
        question: 'A unidade oferece avaliação física?',
        answer:
          'Sim. Contamos com avaliação física por bioimpedância, com dados de composição corporal, percentual de gordura e massa muscular para acompanhar sua evolução.',
      },
      {
        question: 'Há estacionamento?',
        answer:
          'Sim. A unidade oferece serviço de manobrista (valet) para mais praticidade desde a sua chegada.',
      },
      {
        question: 'Posso conhecer antes de contratar?',
        answer:
          'Com certeza. Você pode agendar uma aula experimental gratuita, conhecer os ambientes e conversar com a equipe sem compromisso.',
      },
    ],
  },
  disclaimer:
    'Protótipo comercial · Campanha e contato devem ser atualizados antes da publicação oficial.',
}

function Alphaville() {
  return <PaginaUnidade unidade={unidade} />;
}

export default Alphaville;
