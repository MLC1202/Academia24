import { linkWhatsapp, type UnidadeSlug } from '../../unidades'

/* Tipos e helpers da página de unidade. */


export type Feature = {
  tag: string
  title: string
  description: string
}

export type ScheduleItem = {
  label: string
  hours: string
}

export type FaqItem = {
  question: string
  answer: string
}

export type Testimonial = {
  quote: string
  name: string
  source: string
}

export type UnidadeData = {
  brand: string
  unitName: string
  region: string
  whatsappMessage: string
  mapsUrl: string
  slug: string
  structureBadge: { value: string; label: string }
  images: { hero: string; structure: string; ambiance: string }
  hero: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    subtitle: string
  }
  quickStats: string[]
  experience: {
    kicker: string
    title: string
    description: string
    features: Feature[]
  }
  structure: {
    kicker: string
    title: string
    description: string
    bullets: string[]
  }
  convenience: {
    kicker: string
    title: string
    description: string
    items: Feature[]
  }
  trial: {
    kicker: string
    title: string
    description: string
  }
  testimonials: {
    kicker: string
    title: string
    intro: string
    items: Testimonial[]
  }
  campaign: {
    kicker: string
    title: string
    description: string
    offerTag: string
    offerTitle: string
    offerDescription: string
  }
  location: {
    kicker: string
    title: string
    address: string[]
    schedule: ScheduleItem[]
  }
  faq: {
    title: string
    items: FaqItem[]
  }
  disclaimer: string
}

/* ---------- WhatsApp ---------- */

/**
 * Link direto do WhatsApp da unidade.
 * Os botoes da LP nao usam mais isso — eles abrem o modal de contato,
 * que salva o lead antes de mandar para a conversa. Mantido para
 * qualquer link direto que voce queira usar fora do fluxo do modal.
 */
export function waLink(unidade: UnidadeData) {
  return linkWhatsapp(unidade.slug as UnidadeSlug, unidade.whatsappMessage) ?? '#'
}
