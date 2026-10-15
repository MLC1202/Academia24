// Passos do formulario de agendamento pro funil do GA ("onde a pessoa
// desistiu"). Cumulativo: o passo N so conta se os anteriores tambem valem.
// Assim quem chega por /agendamento?unidade=norte nao registra "unidade"
// antes de "quem", o que baguncaria o funil.
// Sem imports: e testado direto no Node (tests/funil.test.ts).

export const NOMES_PASSOS = ["quem", "unidade", "horario", "objetivo", "dados"] as const;

export type EstadoFunil = {
  quem: string;
  unidade: string;
  periodo: string;
  objetivo: string;
  completo: boolean; // dados validos + consentimento marcado
};

export function passosConcluidos(e: EstadoFunil): number[] {
  const feitos = [e.quem !== "", e.unidade !== "", e.periodo !== "", e.objetivo !== "", e.completo];
  const passos: number[] = [];
  for (const [passo, feito] of feitos.entries()) {
    if (!feito) break;
    passos.push(passo);
  }
  return passos;
}
