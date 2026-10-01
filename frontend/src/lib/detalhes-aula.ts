// Regras dos detalhes de uma aula (duracao, professor, estudio, categoria)
// no editor da grade. As MESMAS do servidor (backend/src/grade.php) e da
// planilha (lib/planilha/grade.ts). O servidor confere de novo ao salvar.
// (Fica fora do DetalhesAula.tsx porque arquivo de componente so exporta
// componente -- regra do React Fast Refresh.)

import type { Aula } from '../data/grade';

export const DURACAO_MIN = 5;
export const DURACAO_MAX = 300;
// Letras (com acento), numeros, espaco e / - & + . , ( ) '
const NOME_VALIDO = /^[\p{L}\p{N} /\-&+.,()']+$/u;

export const camposTexto = {
  professor: { max: 60, rotulo: 'Professor(a)', exemplo: 'ex.: Carol' },
  estudio: { max: 40, rotulo: 'Estúdio', exemplo: 'ex.: Studio 2' },
  categoria: { max: 40, rotulo: 'Categoria', exemplo: 'ex.: Body Mind' },
} as const;
export type CampoTexto = keyof typeof camposTexto;
export type CampoDetalhe = CampoTexto | 'duracao';

// "" quando ok; senao a frase do problema.
export function problemaCampo(campo: CampoDetalhe, aula: Aula): string {
  if (campo === 'duracao') {
    const d = aula.duracao;
    if (d === undefined) return '';
    return Number.isInteger(d) && d >= DURACAO_MIN && d <= DURACAO_MAX
      ? ''
      : `De ${DURACAO_MIN} a ${DURACAO_MAX} minutos.`;
  }
  const v = (aula[campo] ?? '').trim();
  if (!v) return '';
  if (v.length > camposTexto[campo].max) return `No máximo ${camposTexto[campo].max} caracteres.`;
  if (!NOME_VALIDO.test(v)) return "Use só letras, números e / - & + . , ( ) '";
  return '';
}

// Primeiro problema da aula (pra barrar o salvar), ou "".
export function problemaDetalhes(aula: Aula): string {
  for (const campo of ['duracao', 'professor', 'estudio', 'categoria'] as const) {
    const p = problemaCampo(campo, aula);
    if (p) return `${campo === 'duracao' ? 'duração' : camposTexto[campo].rotulo.toLowerCase()}: ${p}`;
  }
  return '';
}

// "60 min · Carol · Studio 2 · Body Mind" (vazio se nao tem nada)
export function resumoDetalhes(aula: Aula): string {
  return [
    aula.duracao ? `${aula.duracao} min` : '',
    aula.professor?.trim() ?? '',
    aula.estudio?.trim() ?? '',
    aula.categoria?.trim() ?? '',
  ]
    .filter(Boolean)
    .join(' · ');
}

// Ao salvar: tira espacos, junta espacos repetidos e some com campo vazio.
export function limparDetalhes(aula: Aula): Aula {
  const limpa: Aula = { ...aula };
  for (const campo of Object.keys(camposTexto) as CampoTexto[]) {
    const v = (aula[campo] ?? '').replace(/\s+/g, ' ').trim();
    if (v) limpa[campo] = v;
    else delete limpa[campo];
  }
  if (limpa.duracao === undefined || Number.isNaN(limpa.duracao)) delete limpa.duracao;
  return limpa;
}
