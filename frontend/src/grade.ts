/**
 * Grade de aulas coletivas — modelo de dados e a semana do calendário.
 *
 * A grade é semanal e se repete: o que muda a cada semana é só o número
 * do dia, calculado a partir de hoje. Não existe "grade de 15/09": existe
 * "grade de segunda", e a aba mostra a segunda desta semana.
 */

import type { UnidadeSlug } from './unidades';

export type Dia = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export type Aula = {
  /** Só para o React e para o editor identificarem a linha. */
  id: string;
  modalidade: string;
  /** Formato 24h, 'HH:MM'. */
  hora: string;
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

/** Índice 0 = segunda, 6 = domingo (o getDay() nativo começa no domingo). */
function indiceDoDia(data: Date) {
  return (data.getDay() + 6) % 7;
}

export function diaDeHoje(hoje = new Date()): Dia {
  return dias[indiceDoDia(hoje)].chave;
}

/**
 * A semana corrente, de segunda a domingo, com o número de cada dia.
 * Vira o mês sozinho: se hoje é 30/09, a aba de domingo mostra 05.
 */
export function semanaAtual(hoje = new Date()) {
  const segunda = new Date(hoje);
  segunda.setHours(0, 0, 0, 0);
  segunda.setDate(segunda.getDate() - indiceDoDia(hoje));

  return dias.map((dia, i) => {
    const data = new Date(segunda);
    data.setDate(segunda.getDate() + i);
    return {
      ...dia,
      data,
      numero: String(data.getDate()).padStart(2, '0'),
      hoje: dia.chave === diaDeHoje(hoje),
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

/**
 * ============================ EXEMPLO ============================
 * Grade de partida, só para a seção não nascer vazia. A grade real de
 * cada unidade deve ser cadastrada em /admin/dashboard — o que for
 * salvo lá substitui isto.
 * =================================================================
 */
function exemplo(aulas: [Dia, string, string][]): GradeUnidade {
  const grade = gradeVazia();
  aulas.forEach(([dia, hora, modalidade], i) => {
    grade[dia].push({ id: `ex-${i}`, hora, modalidade });
  });
  return grade;
}

export const gradesPadrao: Grades = {
  alphaville: exemplo([
    ['seg', '07:00', 'Alongamento'],
    ['seg', '19:00', 'Spinning'],
    ['ter', '08:00', 'Pilates'],
    ['ter', '19:00', 'Funcional'],
    ['qua', '07:00', 'Alongamento'],
    ['qua', '19:00', 'Spinning'],
    ['qui', '08:00', 'Pilates'],
    ['qui', '19:00', 'Funcional'],
    ['sex', '07:00', 'Ritmos'],
    ['sab', '09:00', 'Funcional'],
  ]),
  norte: exemplo([
    ['seg', '06:00', 'Funcional'],
    ['seg', '18:30', 'Ritmos'],
    ['ter', '06:00', 'Spinning'],
    ['ter', '19:00', 'Jump'],
    ['qua', '06:00', 'Funcional'],
    ['qua', '18:30', 'Ritmos'],
    ['qui', '06:00', 'Spinning'],
    ['qui', '19:00', 'Jump'],
    ['sex', '06:00', 'Funcional'],
    ['sab', '09:00', 'Ritmos'],
  ]),
  cambui: exemplo([
    ['seg', '07:30', 'Pilates'],
    ['seg', '19:30', 'Funcional'],
    ['ter', '07:30', 'Alongamento'],
    ['ter', '19:30', 'Spinning'],
    ['qua', '07:30', 'Pilates'],
    ['qua', '19:30', 'Funcional'],
    ['qui', '07:30', 'Alongamento'],
    ['qui', '19:30', 'Spinning'],
    ['sex', '07:30', 'Pilates'],
    ['sab', '10:00', 'Alongamento'],
  ]),
  lagoa: exemplo([
    ['seg', '08:00', 'Funcional'],
    ['seg', '19:00', 'Ritmos'],
    ['ter', '08:00', 'Spinning'],
    ['ter', '19:00', 'Pilates'],
    ['qua', '08:00', 'Funcional'],
    ['qua', '19:00', 'Ritmos'],
    ['qui', '08:00', 'Spinning'],
    ['qui', '19:00', 'Pilates'],
    ['sex', '08:00', 'Funcional'],
    ['sab', '09:30', 'Ritmos'],
  ]),
};
