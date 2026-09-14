// Modelo da grade de aulas coletivas.
// A grade e sempre semanal e se repete: nao existe "grade do dia 15/09",
// existe "grade de segunda". O que muda toda semana e so o numero do dia,
// que eu calculo a partir de hoje.

import type { UnidadeSlug } from './unidades';

export type Dia = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export type Aula = {
  // So pro React e pro editor saberem qual linha e qual.
  id: string;
  modalidade: string;
  // Sempre em 24h, no formato 'HH:MM'.
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

// Aqui 0 e segunda e 6 e domingo. O getDay() do JS comeca no domingo, por
// isso o +6 % 7.
function indiceDoDia(data: Date) {
  return (data.getDay() + 6) % 7;
}

export function diaDeHoje(hoje = new Date()): Dia {
  return dias[indiceDoDia(hoje)].chave;
}

// Monta a semana atual, de segunda a domingo, ja com o numero de cada dia.
// Vira o mes sozinho: se hoje e 30/09, a aba de domingo mostra 05.
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

// Daqui pra baixo e so exemplo, pra secao nao nascer vazia.
// A grade de verdade de cada unidade e cadastrada em /admin/dashboard, e o
// que for salvo la substitui isto.
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
