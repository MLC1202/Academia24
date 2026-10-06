// Modelo da grade de aulas coletivas.
// A grade e sempre semanal e se repete: nao existe "grade do dia 15/09",
// existe "grade de segunda". O site mostra sempre os proximos 7 dias a
// partir de hoje (proximosDias), e so o numero de cada dia e calculado.

import gradeExemplo from '../../../backend/sql/seeds/grade-exemplo.json';
import { SLUGS } from './slugs';
import { hojeNoSite, indiceDiaSemana, somarDias } from '../lib/horario-site';
import type { UnidadeSlug } from './unidades';

export type Dia = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export type Aula = {
  // So pro React e pro editor saberem qual linha e qual.
  id: string;
  modalidade: string;
  // Sempre em 24h, no formato 'HH:MM'.
  hora: string;
  // Detalhes opcionais (vem da planilha). Na grade do site aparecem numa
  // linha pequena embaixo do nome da aula.
  duracao?: number; // minutos
  professor?: string;
  categoria?: string;
  estudio?: string;
};

export type GradeUnidade = Record<Dia, Aula[]>;
export type Grades = Record<UnidadeSlug, GradeUnidade>;

export const dias: { chave: Dia; curto: string; longo: string }[] = [
  { chave: 'seg', curto: 'Seg', longo: 'Segunda' },
  { chave: 'ter', curto: 'Ter', longo: 'Terça' },
  { chave: 'qua', curto: 'Qua', longo: 'Quarta' },
  { chave: 'qui', curto: 'Qui', longo: 'Quinta' },
  { chave: 'sex', curto: 'Sex', longo: 'Sexta' },
  { chave: 'sab', curto: 'Sáb', longo: 'Sábado' },
  { chave: 'dom', curto: 'Dom', longo: 'Domingo' },
];

// Os proximos 7 dias, comecando HOJE no horario de Brasilia (nao no do
// aparelho: ver lib/horario-site.ts). Dia que ja passou sai da lista e o
// mesmo dia da semana que vem entra no fim: se hoje e quarta 30/09, a lista
// vai de qua 30 ate ter 06/10. Cada dia usa a grade do seu dia da semana
// (a grade e semanal), so muda o numero. Vira o mes sozinho.
export function proximosDias(hoje: string = hojeNoSite()) {
  return Array.from({ length: 7 }, (_, i) => {
    const iso = somarDias(hoje, i); // 'AAAA-MM-DD'
    return {
      ...dias[indiceDiaSemana(iso)],
      iso,
      numero: iso.slice(8, 10),
      hoje: i === 0,
    };
  });
}

export function gradeVazia(): GradeUnidade {
  return { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
}

export function ordenarPorHora(aulas: Aula[]) {
  return [...aulas].sort((a, b) => a.hora.localeCompare(b.hora));
}

export function novaAula(): Aula {
  return {
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    modalidade: '',
    hora: '',
  };
}

// Daqui pra baixo e so exemplo, pra secao nao nascer vazia na previa do
// GitHub Pages (que nao tem API). A grade de verdade vem do banco.
// Fonte unica: o mesmo JSON que o backend/bin/seed.php coloca no banco em dev.
// (Fica fora do frontend/, por isso o server.fs.allow no vite.config.ts.)
type AulaExemplo = { dia: Dia; hora: string; modalidade: string };
const exemplos = gradeExemplo as Record<UnidadeSlug, AulaExemplo[]>;

function exemplo(aulas: AulaExemplo[] = []): GradeUnidade {
  const grade = gradeVazia();
  aulas.forEach(({ dia, hora, modalidade }, i) => {
    grade[dia].push({ id: `ex-${i}`, hora, modalidade });
  });
  return grade;
}

export const gradesPadrao = Object.fromEntries(
  SLUGS.map((slug) => [slug, exemplo(exemplos[slug])]),
) as Grades;
