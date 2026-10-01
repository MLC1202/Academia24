// Modelo da grade de aulas coletivas.
// A grade e sempre semanal e se repete: nao existe "grade do dia 15/09",
// existe "grade de segunda". O site mostra sempre os proximos 7 dias a
// partir de hoje (proximosDias), e so o numero de cada dia e calculado.

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

// Aqui 0 e segunda e 6 e domingo. O getDay() do JS comeca no domingo, por
// isso o +6 % 7.
function indiceDoDia(data: Date) {
  return (data.getDay() + 6) % 7;
}

export function diaDeHoje(hoje = new Date()): Dia {
  return dias[indiceDoDia(hoje)].chave;
}

// Os proximos 7 dias, comecando HOJE. Dia que ja passou sai da lista e o
// mesmo dia da semana que vem entra no fim: se hoje e quarta 30/09, a lista
// vai de qua 30 ate ter 06/10. Cada dia usa a grade do seu dia da semana
// (a grade e semanal), so muda o numero. Vira o mes sozinho.
export function proximosDias(hoje = new Date()) {
  const inicio = new Date(hoje);
  inicio.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + i);
    return {
      ...dias[indiceDoDia(data)],
      data,
      numero: String(data.getDate()).padStart(2, '0'),
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
    ['ter', '07:00', 'Alongamento'],  // grade real (Excel), so terca por enquanto
    ['ter', '07:30', 'Fullbody'],
    ['ter', '08:00', 'Boxe'],
    ['ter', '08:00', 'Bike Class'],
    ['ter', '09:00', 'Pilates'],
    ['ter', '09:00', 'Fit Dance'],
    ['ter', '10:00', 'Pilates Flow'],
    ['ter', '17:00', 'Muay Thai'],
    ['ter', '18:00', 'Zumba'],
    ['ter', '18:50', 'Abdômen'],
    ['ter', '19:00', 'Boxe'],
    ['ter', '19:30', 'Bike Class'],
    ['ter', '20:20', 'Alongamento'],
    ['ter', '20:30', 'Jiu Jitsu'],
    // TESTE: aulas inventadas so pra ver a grade cheia. Apagar depois.
    ['ter', '06:00', 'Spinning'],
    ['ter', '06:30', 'HIIT Burn'],
    ['ter', '11:00', 'Yoga'],
    ['ter', '12:00', 'Pilates'],
    ['ter', '12:30', 'Funcional'],
    ['ter', '13:30', 'Zumba'],
    ['ter', '14:30', 'Alongamento'],
    ['ter', '15:30', 'Bike Class'],
    ['ter', '16:30', 'Fit Dance'],
    ['ter', '21:00', 'Boxe'],
    ['ter', '21:30', 'Yoga'],
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
    ['ter', '07:00', 'Kickboxing/Thai'],  // grade real (Excel), so terca por enquanto
    ['ter', '08:15', 'Fast Run'],
    ['ter', '08:45', 'GAP'],
    ['ter', '09:30', 'Fast Bike'],
    ['ter', '10:00', 'Alongamento/Mobilidade'],
    ['ter', '17:30', 'Pilates'],
    ['ter', '18:15', 'Bike Circuit'],
    ['ter', '18:45', 'Alongamento/Mobilidade'],
    ['ter', '19:30', 'Zumba'],
    ['ter', '19:45', 'Yoga'],
    ['ter', '20:30', 'Bike'],
    ['ter', '20:30', 'Kickboxing/Thai'],
    // TESTE: aulas inventadas so pra ver a grade cheia. Apagar depois.
    ['ter', '06:00', 'Fast Bike'],
    ['ter', '06:30', 'Funcional'],
    ['ter', '11:00', 'Pilates'],
    ['ter', '12:00', 'GAP'],
    ['ter', '12:30', 'Zumba'],
    ['ter', '13:30', 'Fullbody'],
    ['ter', '14:30', 'Yoga'],
    ['ter', '15:30', 'Step Iniciante'],
    ['ter', '16:30', 'Fitdance'],
    ['ter', '21:00', 'Bike Circuit'],
    ['ter', '21:30', 'Alongamento'],
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
    ['ter', '07:00', 'Bike Class'],  // grade real (Excel), so terca por enquanto
    ['ter', '08:00', 'Workout'],
    ['ter', '08:45', 'Ritmos'],
    ['ter', '09:15', 'Yoga'],
    ['ter', '09:30', 'Yoga'],
    ['ter', '19:00', 'Power Body'],
    ['ter', '20:00', 'Yoga'],
    // TESTE: aulas inventadas so pra ver a grade cheia. Apagar depois.
    ['ter', '06:00', 'Workout'],
    ['ter', '06:30', 'Power Local'],
    ['ter', '10:15', 'Flex Mobility'],
    ['ter', '11:00', 'Pilates'],
    ['ter', '12:00', 'Fast Burn'],
    ['ter', '12:30', 'Funcional'],
    ['ter', '13:30', 'Ritmos'],
    ['ter', '14:30', 'Yoga'],
    ['ter', '15:30', 'Bike Class'],
    ['ter', '16:30', 'Power Body'],
    ['ter', '17:30', 'Pilates'],
    ['ter', '18:30', 'Fast Burn'],
    ['ter', '21:00', 'Alongamento'],
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
    ['ter', '07:30', 'Bike Class'],  // grade real (Excel), so terca por enquanto
    ['ter', '08:15', 'Alongamento'],
    ['ter', '10:45', 'Step'],
    ['ter', '18:00', 'Extreme 24H'],
    ['ter', '19:00', 'GAP'],
    ['ter', '20:00', 'Fight 24 Club'],
    // TESTE: aulas inventadas so pra ver a grade cheia. Apagar depois.
    ['ter', '06:00', 'Bike Express'],
    ['ter', '06:30', 'Club Funcional'],
    ['ter', '09:00', 'Yoga'],
    ['ter', '11:00', 'Localizada'],
    ['ter', '12:00', 'Power Gym'],
    ['ter', '12:30', 'Zumba'],
    ['ter', '13:30', 'Pilates'],
    ['ter', '14:30', 'Ritmos'],
    ['ter', '15:30', 'Bike Class'],
    ['ter', '16:30', 'Step'],
    ['ter', '17:30', 'Club Funcional'],
    ['ter', '18:30', 'Bike Class'],
    ['ter', '21:00', 'Yoga'],
    ['qua', '08:00', 'Funcional'],
    ['qua', '19:00', 'Ritmos'],
    ['qui', '08:00', 'Spinning'],
    ['qui', '19:00', 'Pilates'],
    ['sex', '08:00', 'Funcional'],
    ['sab', '09:30', 'Ritmos'],
  ]),
};
