// Quando o Google Analytics pode ligar. Tudo chega por parametro (nada de
// window nem import.meta.env) pra ser testado no Node:
// tests/analytics-regras.test.ts.

export type CondicoesGa = {
  gaId: string;
  producao: boolean;
  debug: boolean; // build com VITE_GA_DEBUG=1: testar no DebugView fora do dominio
  hostname: string;
  hostSite: string;
  caminho: string;
  escolha: "aceito" | "recusado" | null;
};

// /admin e so a dona usando: nao entra nas estatisticas.
export function ehCaminhoAdmin(caminho: string): boolean {
  return caminho === "/admin" || caminho.startsWith("/admin/");
}

export function deveAtivarAnalytics(c: CondicoesGa): boolean {
  if (!c.gaId || !c.producao) return false;
  // Fora do dominio oficial (previa do GitHub Pages, vite preview) nao mede.
  if (!c.debug && c.hostname !== c.hostSite) return false;
  if (c.escolha !== "aceito") return false;
  return !ehCaminhoAdmin(c.caminho);
}
