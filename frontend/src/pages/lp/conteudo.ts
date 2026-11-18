// Textos, fotos e links das 4 LPs (mesmo layout, TemplateRede). Copiados das
// LPs antigas feitas no Lovable, que sairam do ar. Os botoes sao iguais nas
// quatro; so o link de planos e a unidade do agendamento mudam (vem de
// data/unidades.ts).
//
// Fotos em public/imagens/lp/<slug>/ (JPG 1600 px, baixadas das LPs antigas).

import type { UnidadeSlug } from "../../data/unidades";

type Card = { titulo: string; texto: string };
type Foto = { src: string; alt: string };

export type LpRede = {
  nome: string;
  whatsapp: string;
  // Texto do botao fixo no canto da tela.
  hero: {
    foto: Foto;
    kicker: string;
    titulo: string;
    texto: string;
    destaque: { forte: string; sub: string };
    cta: string;
    ctaSecundario: string;
    nota: string;
    // legenda em linhas: cada item vira uma linha (as LPs quebram ali).
    numeros: { valor: string; legenda: string[] }[];
  };
  diferenciais: {
    kicker: string;
    titulo: string;
    texto: string;
    cards: Card[];
  };
  destaque: {
    foto: Foto;
    kicker: string;
    titulo: string;
    texto: string;
    itens: string[];
    cta: string;
  };
  // So a Alphaville tem (lojas, massoterapia, lanchonete, valet).
  facilidades?: { kicker: string; titulo: string; texto: string; cards: Card[] };
  galeria: { kicker: string; titulo: string; texto: string; fotos: Foto[] };
  google: { kicker: string; titulo: string; link: string; nota?: string; rotulo: string; texto: string };
  oferta: {
    kicker: string;
    titulo: string;
    texto: string;
    card: { kicker: string; titulo: string; texto: string; cta: string; nota: string };
  };
  local: {
    kicker: string;
    titulo: string;
    endereco: string[];
    mapa: string;
    textoMapa: string;
    horarios: [string, string][];
    faq: [string, string][];
  };
};

const foto = (slug: string, nome: string, alt: string): Foto => ({
  src: `${import.meta.env.BASE_URL}imagens/lp/${slug}/${nome}.jpg`,
  alt,
});

// "5511915371685", "Alphaville" -> https://wa.me/5511915371685?text=...
const whatsapp = (numero: string, unidade: string) =>
  `https://wa.me/${numero}?text=${encodeURIComponent(`Quero saber mais sobre a Unidade ${unidade}`)}`;

const HORARIOS: [string, string][] = [
  ["Segunda a sexta", "05h às 23h"],
  ["Sábado", "07h às 15h"],
  ["Domingos e feriados", "08h às 14h"],
];

const EQUIPAMENTOS_LEGENDA = [
  "Life Fitness e Hammer Strength: biomecânica, segurança,",
  "durabilidade e alta performance.",
];

// Link curto de avaliacoes que as LPs de Campinas usavam.
const GOOGLE_CAMPINAS = "https://share.google/VuQk2rhqnUKNydcuM";

export const LPS_REDE: Record<UnidadeSlug, LpRede> = {
  alphaville: {
    nome: "Alphaville",
    whatsapp: whatsapp("5511915371685", "Alphaville"),
    hero: {
      foto: foto("alphaville", "hero", "Fachada da 24 Wellness Unidade Alphaville"),
      kicker: "Rede 24",
      titulo: "Uma academia feita para a sua rotina.",
      texto:
        "Estrutura, orientação e proximidade para você cuidar da sua saúde, evoluir e fazer da atividade física um hábito que permanece. Mais do que uma academia. Um lugar para começar e continuar.",
      destaque: { forte: "Aula experimental gratuita", sub: "Conheça antes de decidir" },
      cta: "Quero conhecer os planos",
      ctaSecundario: "Conhecer a unidade",
      nota: "Atendimento rápido · Sem compromisso",
      numeros: [
        { valor: "1.800 m²", legenda: ["de estrutura"] },
        { valor: "Equipamentos Premium", legenda: EQUIPAMENTOS_LEGENDA },
        { valor: "05h–23h", legenda: ["segunda a sexta"] },
      ],
    },
    diferenciais: {
      kicker: "A experiência 24 Wellness",
      titulo: "Uma estrutura completa para uma rotina que pede mais.",
      texto:
        "Na Unidade Alphaville, cada detalhe foi pensado para unir performance, praticidade e bem-estar. São 1.800 m², equipamentos de alto padrão e um ambiente familiar e acolhedor — do momento em que você chega até o final do seu treino.",
      cards: [
        { titulo: "1.800 m² para treinar com liberdade", texto: "Ambientes amplos e setores organizados para uma rotina mais confortável." },
        { titulo: "Life Fitness e Hammer Strength", texto: "Equipamentos de alto padrão para treinos mais completos, seguros e eficientes." },
        { titulo: "Academia climatizada", texto: "Conforto térmico em todos os ambientes para você manter o foco no treino." },
        { titulo: "Serviço de manobrista", texto: "Mais praticidade para chegar, estacionar e começar o treino." },
        { titulo: "Tudo em um só lugar", texto: "Loja de roupas fitness, loja de suplementos e serviço de massoterapia na unidade." },
        { titulo: "Ambiente familiar e acolhedor", texto: "Um espaço agradável, com atendimento próximo, para você e sua família se sentirem bem." },
        { titulo: "Avaliação física completa", texto: "Bioimpedância com dados de composição corporal, percentual de gordura e massa muscular." },
      ],
    },
    destaque: {
      foto: foto("alphaville", "destaque", "Área de cardio com esteiras e bikes Life Fitness na Unidade Alphaville"),
      kicker: "Espaço que acompanha seu ritmo",
      titulo: "Liberdade para treinar do seu jeito.",
      texto:
        "Uma academia ampla, climatizada e equipada com Life Fitness e Hammer Strength para você construir uma rotina consistente e evoluir com conforto.",
      itens: [
        "1.800 m² com áreas amplas para musculação e cardio",
        "Equipamentos Life Fitness e Hammer Strength",
        "Avaliação física com bioimpedância para acompanhar sua evolução",
        "Ambientes organizados, climatizados e familiares",
        "Equipe próxima durante toda a sua experiência",
      ],
      cta: "Agendar aula experimental",
    },
    facilidades: {
      kicker: "Praticidade desde a chegada",
      titulo: "Bem-estar dentro e fora do treino.",
      texto:
        "Conte com facilidades que tornam sua rotina mais prática e completa, em um ambiente familiar preparado para cuidar de você.",
      cards: [
        { titulo: "Lojas", texto: "Roupas fitness e suplementos disponíveis na própria unidade." },
        { titulo: "Massoterapia", texto: "Serviço de massoterapeuta para complementar seu cuidado e recuperação." },
        { titulo: "Lanchonete", texto: "Treino completo. Experiência completa. Na 24 Alphaville, você treina, cuida da saúde e ainda aproveita nossa lanchonete." },
        { titulo: "Valet", texto: "Serviço de manobrista para a sua comodidade." },
      ],
    },
    galeria: {
      kicker: "A experiência Alphaville",
      titulo: "Premium sem ser impessoal.",
      texto:
        "Um ambiente climatizado, acolhedor e com atendimento próximo para você se sentir bem desde a chegada até o fim do treino.",
      fotos: [
        foto("alphaville", "galeria-1", "Área de peso livre"),
        foto("alphaville", "galeria-2", "Sala de bike"),
        foto("alphaville", "galeria-3", "Musculação e máquinas"),
      ],
    },
    google: {
      kicker: "Confiança para começar",
      titulo: "Uma academia feita para fazer parte da sua rotina.",
      link: "https://www.google.com/search?q=Academia+24+Wellness+-+Unidade+Alphaville#lrd=0x94cf023c4a5b88b7:0xe8100990b40fad16,1,,,,",
      nota: "4,5",
      rotulo: "Nota real do Google",
      texto: "Clique para ver todas as avaliações no Google.",
    },
    oferta: {
      kicker: "Conheça antes de decidir",
      titulo: "Viva a experiência 24 Wellness.",
      texto:
        "Agende uma aula experimental gratuita, conheça os ambientes e converse com nossa equipe sobre o plano que combina com sua rotina.",
      card: {
        kicker: "Exclusivo para novos alunos",
        titulo: "Comece agora com a condição vigente da unidade.",
        texto: "Receba as opções de planos e valores disponíveis e agende sua visita sem compromisso.",
        cta: "Falar com a equipe no WhatsApp",
        nota: "Resposta rápida pelo WhatsApp",
      },
    },
    local: {
      kicker: "Alphaville Industrial · Barueri",
      titulo: "No coração de Alphaville.",
      endereco: ["Alameda Grajaú, 525", "Alphaville Industrial · Barueri · SP"],
      mapa: "https://www.google.com/maps/search/?api=1&query=Alameda%20Graja%C3%BA%2C%20525%20Alphaville%20Industrial%20Barueri",
      textoMapa: "Abrir no Google Maps",
      horarios: HORARIOS,
      faq: [
        ["A academia é climatizada?", "Sim. A Unidade Alphaville conta com ambientes climatizados."],
        ["A unidade oferece avaliação física?", "Sim. Oferecemos avaliação física com bioimpedância para acompanhar indicadores de composição corporal e evolução."],
        ["Há estacionamento?", "A unidade oferece serviço de manobrista para maior comodidade."],
        ["Posso conhecer antes de contratar?", "Sim. Você pode solicitar uma aula experimental gratuita e conhecer a estrutura."],
      ],
    },
  },

  cambui: {
    nome: "Cambuí",
    whatsapp: whatsapp("5519989840304", "Cambuí"),
    hero: {
      foto: foto("cambui", "hero", "Fachada da 24 Health Club Unidade Cambuí"),
      kicker: "Premium · Acolhedora · No coração do Cambuí",
      titulo: "Uma academia feita para a sua rotina.",
      texto:
        "Estrutura, orientação e proximidade para você cuidar da sua saúde, evoluir e fazer da atividade física um hábito que permanece.",
      destaque: { forte: "Condição especial para novas matrículas", sub: "Disponibilidade limitada" },
      cta: "Quero conhecer os planos",
      ctaSecundario: "Conhecer a unidade",
      nota: "Atendimento rápido · Sem compromisso",
      numeros: [
        { valor: "+1.200", legenda: ["m² climatizados"] },
        { valor: "Equipamentos Premium", legenda: EQUIPAMENTOS_LEGENDA },
        { valor: "05h–23h", legenda: ["segunda a sexta"] },
      ],
    },
    diferenciais: {
      kicker: "Por que escolher a 24 Cambuí",
      titulo: "Seu treino. Seu espaço. Seu momento.",
      texto:
        "Uma academia completa, acolhedora e bem equipada para quem busca resultado sem abrir mão de conforto, praticidade e atendimento próximo.",
      cards: [
        { titulo: "+1.200 m² climatizados", texto: "Mais espaço e temperatura agradável para treinar com conforto." },
        { titulo: "Equipamentos premium", texto: "Life Fitness e Hammer Strength para biomecânica e alta performance." },
        { titulo: "Serviço de manobrista", texto: "Chegue, entregue o carro e comece seu treino sem perder tempo." },
        { titulo: "Avaliação física completa", texto: "Bioimpedância para acompanhar composição corporal, resultados e evolução." },
      ],
    },
    destaque: {
      foto: foto("cambui", "destaque", "Equipamentos Life Fitness e Hammer Strength"),
      kicker: "Life Fitness + Hammer Strength",
      titulo: "Equipamentos que acompanham a sua evolução.",
      texto:
        "Marcas premium reconhecidas mundialmente pela biomecânica, segurança, durabilidade e alta performance.",
      itens: [
        "Movimentos mais naturais e seguros",
        "Estrutura robusta para treinos intensos",
        "Variedade para todos os níveis de treino",
      ],
      cta: "Agendar aula experimental",
    },
    galeria: {
      kicker: "A experiência Cambuí",
      titulo: "Premium sem ser impessoal.",
      texto:
        "Um ambiente climatizado, acolhedor e com atendimento próximo para você se sentir bem desde a chegada até o fim do treino.",
      fotos: [
        foto("cambui", "galeria-1", "Musculação e cardio"),
        foto("cambui", "galeria-2", "Área de peso livre"),
        foto("cambui", "galeria-3", "Sala de bike"),
      ],
    },
    google: {
      kicker: "Quem conhece, recomenda",
      titulo: "A experiência dos nossos alunos fala por nós.",
      link: GOOGLE_CAMPINAS,
      nota: "4,9",
      rotulo: "Nota real do Google",
      texto: "Clique para ver todas as avaliações no Google.",
    },
    oferta: {
      kicker: "Conheça antes de decidir",
      titulo: "Viva a experiência 24 Cambuí.",
      texto:
        "Agende uma aula experimental gratuita, conheça a estrutura e descubra como é treinar em um ambiente completo e acolhedor.",
      card: {
        kicker: "Exclusivo para novos alunos",
        titulo: "Comece agora com uma condição especial.",
        texto: "Aula experimental gratuita e condição especial para novas matrículas.",
        cta: "Falar com a equipe no WhatsApp",
        nota: "Sem compromisso · Resposta rápida",
      },
    },
    local: {
      kicker: "No coração do Cambuí",
      titulo: "24 Health Club Unidade Cambuí",
      endereco: ["Rua Santa Cruz, 299", "Cambuí · Campinas · SP"],
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua%20Santa%20Cruz%2C%20299%20Cambui%20Campinas",
      textoMapa: "Abrir no Google Maps",
      horarios: HORARIOS,
      faq: [
        ["A unidade oferece avaliação física?", "Sim. Oferecemos avaliação física com bioimpedância para acompanhar composição corporal e evolução."],
        ["Posso fazer uma aula experimental?", "Sim. Solicite o agendamento pelo WhatsApp e confirme a disponibilidade."],
        ["A academia é climatizada?", "Sim. A unidade possui ar-condicionado em seus ambientes de treino."],
        ["Quais planos estão disponíveis?", "Fale com a equipe para conhecer as condições vigentes e escolher o plano ideal."],
      ],
    },
  },

  lagoa: {
    nome: "Lagoa",
    whatsapp: whatsapp("5519992078463", "Lagoa"),
    hero: {
      foto: foto("lagoa", "hero", "Fachada da 24 Health Club Unidade Lagoa"),
      kicker: "Estrutura premium em Campinas",
      titulo: "Seu treino merece uma estrutura à altura dos seus objetivos.",
      texto:
        "Mais de 1.200 m², equipamentos Life Fitness e Hammer Strength, aulas coletivas, vestiários completos e serviço de manobrista.",
      destaque: { forte: "Condição especial para novas matrículas", sub: "Disponibilidade limitada" },
      cta: "Quero conhecer os planos",
      ctaSecundario: "Conhecer a unidade",
      nota: "Atendimento rápido · Sem compromisso",
      numeros: [
        { valor: "+1.200", legenda: ["m² de estrutura"] },
        {
          valor: "Equipamentos Premium",
          legenda: [
            "Marcas reconhecidas mundialmente pela biomecânica, segurança,",
            "durabilidade e sensação de treino com peso livre.",
          ],
        },
        { valor: "05h–23h", legenda: ["segunda a sexta"] },
      ],
    },
    diferenciais: {
      kicker: "Por que escolher a 24 Lagoa",
      titulo: "Mais do que uma academia. Uma experiência completa.",
      texto: "Estrutura, comodidade e acompanhamento para o treino caber na sua rotina.",
      cards: [
        { titulo: "1.200 m²", texto: "Mais espaço para treinar com conforto e sem sensação de lotação." },
        { titulo: "Padrão premium", texto: "Life Fitness e Hammer Strength para biomecânica e alta performance." },
        { titulo: "Chegue e treine", texto: "Serviço de manobrista para você não perder tempo procurando vaga." },
        { titulo: "Rotina completa", texto: "Musculação, aulas coletivas, vestiários e cantina em um só lugar." },
      ],
    },
    destaque: {
      foto: foto("lagoa", "destaque", "Equipamentos de musculação de alta performance"),
      kicker: "Life Fitness + Hammer Strength",
      titulo: "Performance começa pelo equipamento certo.",
      texto:
        "Marcas premium reconhecidas mundialmente pela biomecânica, segurança, durabilidade e sensação de treino com peso livre.",
      itens: [
        "Movimentos mais naturais e seguros",
        "Equipamentos robustos para treinos intensos",
        "Variedade para evoluir sem cair na rotina",
      ],
      cta: "Agendar aula experimental",
    },
    galeria: {
      kicker: "Conheça a unidade",
      titulo: "Uma academia feita para você querer voltar.",
      texto: "Estrutura completa da Unidade Lagoa: musculação, cardio e sala de spinning.",
      fotos: [
        foto("lagoa", "galeria-1", "Sala de musculação"),
        foto("lagoa", "galeria-2", "Equipamentos premium"),
        foto("lagoa", "galeria-3", "Sala de spinning"),
      ],
    },
    google: {
      kicker: "Quem conhece, recomenda",
      titulo: "A experiência dos nossos alunos fala por nós.",
      link: GOOGLE_CAMPINAS,
      nota: "4,9",
      rotulo: "Nota real do Google",
      texto: "Clique para ver todas as avaliações no Google.",
    },
    oferta: {
      kicker: "Exclusivo para novos alunos",
      titulo: "Conheça a 24 Lagoa com uma condição especial.",
      texto:
        "Solicite os valores pelo WhatsApp e escolha entre conhecer a estrutura, agendar uma visita ou fazer uma aula experimental.",
      card: {
        kicker: "Condição da campanha",
        titulo: "Oferta por tempo limitado",
        texto: "",
        cta: "Falar com a equipe no WhatsApp",
        nota: "Sem compromisso · Resposta rápida",
      },
    },
    local: {
      kicker: "Estamos perto de você",
      titulo: "24 Health Club Unidade Lagoa",
      endereco: ["Av. Doutor Heitor Penteado, 1740", "Lagoa · Campinas · SP"],
      mapa: "https://www.google.com/maps/search/?api=1&query=Av.%20Doutor%20Heitor%20Penteado%2C%201740%20Campinas",
      textoMapa: "Ver localização",
      horarios: HORARIOS,
      faq: [
        ["Posso fazer uma aula experimental?", "Sim. Solicite o agendamento pelo WhatsApp e confirme a disponibilidade."],
        ["A unidade possui estacionamento?", "A unidade oferece serviço de manobrista para mais comodidade."],
        ["A unidade oferece avaliação física?", "Sim. Oferecemos avaliação física com bioimpedância para acompanhar composição corporal e evolução."],
        ["Quais planos estão disponíveis?", "Fale com a equipe para conhecer as condições vigentes e encontrar o plano ideal."],
      ],
    },
  },

  norte: {
    nome: "Norte",
    whatsapp: whatsapp("5511976047297", "Norte"),
    hero: {
      foto: foto("norte", "hero", "Salão de musculação da unidade Norte do 24 Health Club"),
      kicker: "Unidade Norte · Vila Guilherme",
      titulo: "Uma estrutura completa para o treino caber na sua rotina e a orientação para você evoluir.",
      texto:
        "Mais de 3.000 m², mais de 80 vagas, abertura às 4h e uma equipe preparada para entender seu objetivo e orientar seu começo.",
      destaque: { forte: "Condição especial para novas matrículas", sub: "Disponibilidade limitada" },
      cta: "Quero conhecer os planos",
      ctaSecundario: "Conhecer a unidade",
      nota: "Atendimento rápido · Sem compromisso",
      numeros: [
        { valor: "3.000 m²+", legenda: ["de estrutura"] },
        { valor: "+80 vagas", legenda: ["de estacionamento"] },
        { valor: "04h–23h", legenda: ["segunda a sexta"] },
      ],
    },
    diferenciais: {
      kicker: "Seu começo na 24",
      titulo: "Não é apenas sobre começar. É sobre construir uma rotina que você consiga manter.",
      texto:
        "Na 24 Norte, estrutura e orientação trabalham juntas. Você conhece a unidade, conversa sobre seu objetivo e encontra um caminho compatível com sua rotina.",
      cards: [
        { titulo: "3.000 m²+ para treinar", texto: "Amplitude para diferentes experiências de treino." },
        { titulo: "+80 vagas de estacionamento", texto: "Praticidade para chegar e começar." },
        { titulo: "+20 anos de tradição", texto: "Vínculo com a Zona Norte." },
        { titulo: "Abertura às 4h", texto: "Nos dias úteis, para o treino caber antes dos compromissos." },
        { titulo: "Life Fitness e Technogym", texto: "Um parque diversificado de equipamentos para diferentes objetivos." },
        { titulo: "Avaliação física completa", texto: "Bioimpedância para acompanhar a evolução." },
      ],
    },
    destaque: {
      foto: foto("norte", "destaque", "Vista panorâmica do salão de treino da unidade Norte"),
      kicker: "Estrutura que favorece seu treino",
      titulo: "Mais espaço para treinar. Mais liberdade para evoluir.",
      texto:
        "Grandes áreas, pé-direito alto, circulação natural de ar e variedade para uma experiência compatível com seu objetivo.",
      itens: [
        "Musculação e cardio em áreas amplas",
        "Life Fitness e Technogym",
        "Aulas coletivas e variedade",
        "Mercado autônomo e estacionamento",
      ],
      cta: "Agendar aula experimental",
    },
    galeria: {
      kicker: "A experiência Norte",
      titulo: "Espaço para treinar do seu jeito.",
      texto:
        "Mais do que oferecer acesso, a 24 conecta espaço, avaliação e orientação para apoiar uma rotina possível e consistente.",
      fotos: [
        foto("norte", "galeria-2", "Área de pesos livres e esteiras no mezanino"),
        foto("norte", "galeria-3", "Sala de spinning da unidade Norte"),
        foto("norte", "galeria-4", "Sala de aulas coletivas com acessórios funcionais"),
      ],
    },
    google: {
      kicker: "Quem treina, recomenda",
      titulo: "Espaço, comunidade e apoio para evoluir.",
      link: "https://www.google.com/search?q=Academia+24+Health+Club+-+Unidade+Norte+avaliacoes",
      nota: "4,5",
      rotulo: "Nota real do Google",
      texto: "Clique para ver todas as avaliações no Google.",
    },
    oferta: {
      kicker: "Conheça antes de decidir",
      titulo: "Venha viver a experiência 24 Norte.",
      texto:
        "Conheça a estrutura, converse com nossa equipe e entenda como a 24 pode fazer parte da sua rotina.",
      card: {
        kicker: "Exclusivo para novos alunos",
        titulo: "Comece agora com uma condição especial.",
        texto: "Aula experimental gratuita e condição especial para novas matrículas.",
        cta: "Falar com a equipe no WhatsApp",
        nota: "Sem compromisso · Resposta rápida",
      },
    },
    local: {
      kicker: "Vila Guilherme · São Paulo",
      titulo: "24 Health Club Unidade Norte",
      endereco: ["Rua Maria Cândida, 468", "Vila Guilherme · São Paulo · SP"],
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua%20Maria%20Candida%20468%20Vila%20Guilherme%20Sao%20Paulo",
      textoMapa: "Abrir no Google Maps",
      horarios: [
        ["Segunda a sexta", "04h às 23h"],
        ["Sábado", "07h às 15h"],
        ["Domingos e feriados", "08h às 14h"],
      ],
      faq: [
        ["A unidade oferece avaliação física?", "Sim. Oferecemos avaliação física com bioimpedância para acompanhar composição corporal e evolução."],
        ["O salão de musculação possui ar-condicionado?", "O salão é amplo e possui circulação natural de ar. O ar-condicionado está disponível nas salas de aulas coletivas."],
        ["Quais marcas de equipamentos existem?", "A unidade possui um parque diversificado, incluindo equipamentos Life Fitness, Technogym e outras marcas."],
        ["Quais programas são aceitos?", "Wellhub Silver+ e TotalPass TP3. Consulte categorias e condições diretamente com a unidade."],
      ],
    },
  },
};
