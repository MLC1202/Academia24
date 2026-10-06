// Data e hora "da academia" (America/Sao_Paulo), seja qual for o fuso do
// aparelho de quem visita. O servidor usa o mesmo fuso (cancelamentos, janela
// de 7 dias), entao site e servidor sempre concordam sobre "hoje" e "agora".
// Datas sempre como texto 'AAAA-MM-DD' (o mesmo formato do backend): assim
// nenhuma conta passa pelo fuso do aparelho.

export const FUSO_SITE = 'America/Sao_Paulo';

export type Agora = {
  data: string; // 'AAAA-MM-DD'
  hora: string; // 'HH:MM' (24 h)
};

const formato = new Intl.DateTimeFormat('en-GB', {
  timeZone: FUSO_SITE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function agoraNoSite(quando: Date = new Date()): Agora {
  const p = Object.fromEntries(formato.formatToParts(quando).map((x) => [x.type, x.value]));
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

// 'AAAA-MM-DD' de hoje em Sao Paulo.
export function hojeNoSite(quando: Date = new Date()): string {
  return agoraNoSite(quando).data;
}

// 'AAAA-MM-DD' + n dias. A conta e feita em UTC, que nao tem horario de
// verao: o resultado nunca pula nem repete um dia.
export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

// 0 = segunda ... 6 = domingo, a partir de 'AAAA-MM-DD'.
export function indiceDiaSemana(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number);
  return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
}
