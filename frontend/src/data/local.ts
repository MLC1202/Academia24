// Dados das unidades em formato de dados estruturados (JSON-LD), que o Google
// le pra montar o resultado local. O plugin "seo" do vite.config.ts injeta no
// index.html no build. Sem importacoes: o vite.config.ts le este arquivo.
//
// Nome e endereco precisam ser IGUAIS aos do Perfil da Empresa no Google de
// cada unidade (nomes copiados dos Perfis; "perfil" = link de compartilhamento).
// Coordenadas e CEP vieram do pino do Google Maps.
// Telefone: com DDD, vazio = some do site e do JSON-LD. Copiado da ficha de cada
// unidade no Google Maps (precisa continuar igual ao Perfil da Empresa).
// Nenhuma unidade abre 24h: nao declarar.

type Dia = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

type Horario = { dias: Dia[]; abre: string; fecha: string };

const SEG_SEX: Dia[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const unidades = [
  {
    slug: 'alphaville',
    telefone: '(11) 91537-1685',
    cep: '06454-050',
    lat: -23.4938682,
    lng: -46.8477161,
    nome: 'Academia 24 Wellness - Unidade Alphaville',
    perfil: 'https://share.google/54oGoWVhF7hQVU66E',
    rua: 'Alameda Grajaú, 525',
    bairro: 'Alphaville Industrial',
    cidade: 'Barueri',
    uf: 'SP',
    instagram: 'https://www.instagram.com/24wellnessacademia',
    horarios: [
      { dias: SEG_SEX, abre: '05:00', fecha: '23:00' },
      { dias: ['Saturday'], abre: '07:00', fecha: '15:00' },
      { dias: ['Sunday'], abre: '08:00', fecha: '14:00' },
    ] as Horario[],
  },
  {
    slug: 'norte',
    telefone: '(11) 97604-7297',
    cep: '02071-000',
    lat: -23.5032491,
    lng: -46.6101887,
    nome: 'Academia 24 Health Club - Unidade Norte',
    perfil: 'https://share.google/bob5mFiQlRmyJIwR1',
    rua: 'Rua Maria Cândida, 468',
    bairro: 'Vila Guilherme',
    cidade: 'São Paulo',
    uf: 'SP',
    instagram: 'https://www.instagram.com/academia24healthclub',
    horarios: [
      { dias: SEG_SEX, abre: '04:00', fecha: '23:00' },
      { dias: ['Saturday'], abre: '07:00', fecha: '15:00' },
      { dias: ['Sunday'], abre: '08:00', fecha: '14:00' },
    ] as Horario[],
  },
  {
    slug: 'cambui',
    telefone: '(19) 98984-0304',
    cep: '13024-100',
    lat: -22.8945522,
    lng: -47.0578834,
    nome: 'Academia 24 Health Club - Unidade Cambuí',
    perfil: 'https://share.google/lITXBCJM2BniUP6XW',
    rua: 'Rua Santa Cruz, 299',
    bairro: 'Cambuí',
    cidade: 'Campinas',
    uf: 'SP',
    instagram: 'https://www.instagram.com/academia24healthclubcampinas',
    horarios: [
      { dias: SEG_SEX, abre: '05:00', fecha: '23:00' },
      { dias: ['Saturday'], abre: '07:00', fecha: '15:00' },
      { dias: ['Sunday'], abre: '08:00', fecha: '14:00' },
    ] as Horario[],
  },
  {
    slug: 'lagoa',
    telefone: '(19) 99295-6276',
    cep: '13075-460',
    lat: -22.8760265,
    lng: -47.0487417,
    nome: 'Academia 24 Health Club - Unidade Lagoa',
    perfil: 'https://share.google/Ce4NMGZWtCI13t68b',
    rua: 'Av. Dr. Heitor Penteado, 1740',
    bairro: 'Jardim Nossa Sra. Auxiliadora',
    cidade: 'Campinas',
    uf: 'SP',
    instagram: 'https://www.instagram.com/academia24healthclubcampinas',
    horarios: [
      { dias: SEG_SEX, abre: '05:00', fecha: '23:00' },
      { dias: ['Saturday'], abre: '07:00', fecha: '15:00' },
      { dias: ['Sunday'], abre: '08:00', fecha: '14:00' },
    ] as Horario[],
  },
];

// So digitos com DDD -> "+55..." (formato do link tel: e do JSON-LD).
function internacional(telefone: string) {
  return `+55${telefone.replace(/\D/g, '')}`;
}

// Telefone da unidade pro rodape e pro card: texto como foi colado + link tel:.
export function telefoneDe(slug: string) {
  const t = unidades.find((u) => u.slug === slug)?.telefone;
  return t ? { texto: t, link: `tel:${internacional(t)}` } : null;
}

// Abre o Google Maps direto na ficha da unidade (nome, fotos, avaliacoes,
// rotas). A busca por nome + endereco cai na ficha; so coordenada cairia num
// pino vazio, e o link de compartilhamento (perfil) abre a busca do Google, nao
// o Maps. Sem iframe: nao carrega cookie do Google nem precisa de frame-src.
export function linkMapa(slug: string) {
  const u = unidades.find((x) => x.slug === slug);
  if (!u) return '';
  const busca = encodeURIComponent(`${u.nome} ${u.rua} ${u.cidade}`);
  return `https://www.google.com/maps/search/?api=1&query=${busca}`;
}

// site: endereco com "/" no fim (ex.: https://academia24wellness.com.br/).
export function jsonLdUnidades(site: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': unidades.map((u) => ({
      '@type': 'HealthClub',
      '@id': `${site}#${u.slug}`,
      name: u.nome,
      url: site,
      image: `${site}og.jpg`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: u.rua,
        ...(u.bairro && { addressNeighborhood: u.bairro }),
        ...(u.cep && { postalCode: u.cep }),
        addressLocality: u.cidade,
        addressRegion: u.uf,
        addressCountry: 'BR',
      },
      ...(u.telefone && { telephone: internacional(u.telefone) }),
      geo: { '@type': 'GeoCoordinates', latitude: u.lat, longitude: u.lng },
      ...(u.horarios.length && {
        openingHoursSpecification: u.horarios.map((h) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: h.dias,
          opens: h.abre,
          closes: h.fecha,
        })),
      }),
      sameAs: [u.perfil, u.instagram],
    })),
  };
}
