/**
 * Registro único das unidades.
 *
 * Usado pela home (cards e formulário), pelas landing pages e pelo
 * link de WhatsApp. Mudar aqui reflete em todos os lugares.
 */

export type UnidadeSlug = 'alphaville' | 'norte' | 'cambui' | 'lagoa';

export type UnidadeInfo = {
  nome: string;
  marca: string;
  /** Como aparece no <select> do formulário. */
  rotulo: string;
  /** Usada na trilha de navegação do cabeçalho. */
  cidade: string;
  /** Foto do topo da LP e do card da home. */
  foto: string;
  /**
   * ================== PREENCHER QUANDO RECEBER ==================
   * Só dígitos, com código do país: 55 + DDD + número.
   * Ex.: '5511987654321'
   * Enquanto estiver '', os botões de WhatsApp ficam inertes e o
   * formulário salva o lead sem abrir conversa.
   * ==============================================================
   */
  whatsapp: string;
};

const FOTO_PADRAO =
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=2400&q=80';

export const unidades: Record<UnidadeSlug, UnidadeInfo> = {
  alphaville: {
    nome: 'Alphaville',
    marca: '24 Wellness',
    rotulo: '24 Wellness — Alphaville',
    cidade: 'Barueri',
    foto: FOTO_PADRAO,
    whatsapp: '', // TODO: número da unidade Alphaville
  },
  norte: {
    nome: 'Norte',
    marca: '24 Health Club',
    rotulo: '24 Health Club — Norte',
    cidade: 'São Paulo',
    foto: FOTO_PADRAO,
    whatsapp: '', // TODO: número da unidade Norte
  },
  cambui: {
    nome: 'Cambuí',
    marca: '24 Health Club',
    rotulo: '24 Health Club — Cambuí',
    cidade: 'Campinas',
    foto: FOTO_PADRAO,
    whatsapp: '', // TODO: número da unidade Cambuí
  },
  lagoa: {
    nome: 'Lagoa',
    marca: '24 Health Club',
    rotulo: '24 Health Club — Lagoa',
    cidade: 'Campinas',
    foto: FOTO_PADRAO,
    whatsapp: '', // TODO: número da unidade Lagoa
  },
};

export const slugsUnidades = Object.keys(unidades) as UnidadeSlug[];

export function ehSlugUnidade(valor: string): valor is UnidadeSlug {
  return valor in unidades;
}

/**
 * Link do WhatsApp com a mensagem pronta.
 * Devolve null enquanto a unidade não tiver número cadastrado.
 */
export function linkWhatsapp(slug: UnidadeSlug, mensagem: string) {
  const digitos = unidades[slug].whatsapp.replace(/\D/g, '');
  if (!digitos) return null;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}
