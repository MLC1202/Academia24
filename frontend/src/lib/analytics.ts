// Unica porta pro Google Analytics 4: nenhum componente chama gtag direto.
//
// O script do Google so e baixado depois do "Aceitar" no aviso de cookies
// (Consent Mode basico): antes disso nada sai do navegador pro Google.
// Ele e criado por createElement, e nao colado no index.html, porque a CSP
// do site (public/.htaccess) nao deixa rodar script inline.
//
// Quem chama registrarEvento nao precisa saber de consentimento, ambiente ou
// dominio: com o GA desligado a chamada simplesmente nao faz nada.

import { GA_ID, SITE_URL } from "../data/site";
import { lerConsentimento, nomesCookiesGa } from "./consentimento";
import { deveAtivarAnalytics, ehCaminhoAdmin } from "./analytics-regras";

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

export type NomeEvento =
  | "clique_whatsapp"
  | "clique_lp_unidade"
  | "clique_planos"
  | "clique_instagram"
  | "agendamento_passo"
  | "agendamento_enviado";

const debug = import.meta.env.VITE_GA_DEBUG === "1";
const hostSite = new URL(SITE_URL).hostname;

let ativo = false;

// O gtag.js so reconhece o objeto "arguments" na dataLayer, nao um array.
const gtag: (...args: unknown[]) => void = function () {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
};

// Devolve se o GA ficou ligado. Pode ser chamada varias vezes.
export function iniciarAnalytics(caminho: string): boolean {
  if (ativo) return true;

  const pode = deveAtivarAnalytics({
    gaId: GA_ID,
    producao: import.meta.env.PROD,
    debug,
    hostname: window.location.hostname,
    hostSite,
    caminho,
    escolha: lerConsentimento(),
  });
  if (!pode) return false;

  window.dataLayer = window.dataLayer || [];
  // O site nao faz anuncio: tudo de publicidade fica negado de forma explicita.
  gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  gtag("js", new Date());
  // page_view manual (RastreioPaginas): numa SPA o automatico so ve a 1a pagina.
  gtag("config", GA_ID, { send_page_view: false, ...(debug && { debug_mode: true }) });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  script.onerror = () =>
    console.warn("Google Analytics nao carregou (bloqueador de anuncio ou CSP).");
  document.head.appendChild(script);

  ativo = true;
  return true;
}

// Flag oficial do Google: com ela true o gtag.js carregado para de enviar
// qualquer coisa, inclusive a medicao automatica (rolagem, formularios).
function pausar(pausado: boolean) {
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = pausado;
}

// Chamada a cada troca de rota com o GA ativo. Em /admin o GA fica pausado:
// so impedir o page_view nao basta, porque o script ja esta carregado na SPA.
export function registrarPagina(caminho: string): void {
  if (!ativo) return;
  const admin = ehCaminhoAdmin(caminho);
  pausar(admin);
  if (admin) return;
  gtag("event", "page_view", {
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function registrarEvento(nome: NomeEvento, params: Record<string, string | number>): void {
  if (!ativo) return;
  gtag("event", nome, params);
}

// Ao revogar o consentimento: pausa antes, senao o gtag.js ainda manda um
// ultimo hit (e regrava o cookie) enquanto a pagina recarrega. O GA grava
// no dominio sem "www" e com ponto; apaga nas tres formas porque o navegador
// so remove se o domain bater.
export function revogarAnalytics(): void {
  if (GA_ID) pausar(true);
  const dominio = hostSite.replace(/^www\./, "");
  for (const nome of nomesCookiesGa(document.cookie)) {
    for (const domain of ["", `; domain=${dominio}`, `; domain=.${dominio}`]) {
      document.cookie = `${nome}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domain}`;
    }
  }
}
