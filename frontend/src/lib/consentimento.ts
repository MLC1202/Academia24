// Escolha da pessoa sobre os cookies do Google Analytics (LGPD).
//
// Fica no localStorage com a versao do texto do aviso: se o texto mudar,
// sobe VERSAO_CONSENTIMENTO e o aviso volta a aparecer pra todo mundo.
// Se o storage falhar (Safari anonimo, site bloqueado), a escolha vale so
// nesta visita (escolhaDaVisita) -- nunca vira "aceito" sozinha.
//
// Este arquivo nao importa nada do projeto nem usa import.meta.env: e testado
// direto no Node (tests/consentimento.test.ts).

export type EscolhaCookies = "aceito" | "recusado";

export const VERSAO_CONSENTIMENTO = "2026-10-14";
const CHAVE = "consentimento-cookies";

// Disparado pelo link do rodape pra reabrir o aviso (AvisoCookies escuta).
export const EVENTO_ABRIR_AVISO = "abrir-aviso-cookies";

let escolhaDaVisita: EscolhaCookies | null = null;

// O storage vem por funcao porque o proprio acesso a window.localStorage
// pode lancar erro quando o navegador bloqueia.
export function lerConsentimento(
  obterStorage: () => Pick<Storage, "getItem"> = () => window.localStorage,
): EscolhaCookies | null {
  let bruto: string | null;
  try {
    bruto = obterStorage().getItem(CHAVE);
  } catch (erro) {
    console.warn("Consentimento: localStorage indisponivel, usando a escolha da visita.", erro);
    return escolhaDaVisita;
  }
  if (bruto === null) return escolhaDaVisita;

  try {
    const salvo = JSON.parse(bruto) as { escolha?: unknown; versao?: unknown };
    const valida = salvo.escolha === "aceito" || salvo.escolha === "recusado";
    if (valida && salvo.versao === VERSAO_CONSENTIMENTO) return salvo.escolha as EscolhaCookies;
  } catch (erro) {
    console.warn("Consentimento: valor salvo ilegivel, o aviso vai aparecer de novo.", erro);
  }
  return escolhaDaVisita;
}

// Devolve false se nao deu pra salvar (a escolha ainda vale nesta visita).
export function gravarConsentimento(
  escolha: EscolhaCookies,
  obterStorage: () => Pick<Storage, "setItem"> = () => window.localStorage,
): boolean {
  escolhaDaVisita = escolha;
  try {
    obterStorage().setItem(CHAVE, JSON.stringify({ escolha, versao: VERSAO_CONSENTIMENTO }));
    return true;
  } catch (erro) {
    console.warn("Consentimento: nao deu pra salvar a escolha, ela vale so nesta visita.", erro);
    return false;
  }
}

// "_ga=1; x=2; _ga_ABC=3" -> ["_ga", "_ga_ABC"] (os cookies que o GA4 grava)
export function nomesCookiesGa(cookies: string): string[] {
  return cookies
    .split(";")
    .map((par) => par.split("=")[0].trim())
    .filter((nome) => nome === "_ga" || nome.startsWith("_ga_"));
}

export function abrirPreferenciasCookies(): void {
  window.dispatchEvent(new Event(EVENTO_ABRIR_AVISO));
}

// So pros testes: cada teste comeca sem escolha em memoria.
export function esquecerEscolhaDaVisita(): void {
  escolhaDaVisita = null;
}
