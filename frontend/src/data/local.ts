// Dados das unidades em formato de dados estruturados (JSON-LD), que o Google
// le pra montar o resultado local. O plugin "seo" do vite.config.ts injeta no
// index.html no build. Sem importacoes: o vite.config.ts le este arquivo.
//
// Nome e endereco precisam ser IGUAIS aos do Perfil da Empresa no Google de
// cada unidade. Ainda sem telefone, CEP, coordenadas e link do Perfil: nao
// inventar, acrescentar aqui quando tiver (telephone,
// postalCode, geo, sameAs).
// Nenhuma unidade abre 24h: nao declarar.

type Dia = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

type Horario = { dias: Dia[]; abre: string; fecha: string };

const SEG_SEX: Dia[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const unidades = [
  {
    slug: 'alphaville',
    nome: '24 Wellness Alphaville',
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
    nome: '24 Health Club Norte',
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
    nome: '24 Health Club Cambuí',
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
    nome: '24 Health Club Lagoa',
    rua: 'Av. Doutor Heitor Penteado, 1740',
    bairro: 'Lagoa',
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
        addressLocality: u.cidade,
        addressRegion: u.uf,
        addressCountry: 'BR',
      },
      ...(u.horarios.length && {
        openingHoursSpecification: u.horarios.map((h) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: h.dias,
          opens: h.abre,
          closes: h.fecha,
        })),
      }),
      sameAs: [u.instagram],
    })),
  };
}
