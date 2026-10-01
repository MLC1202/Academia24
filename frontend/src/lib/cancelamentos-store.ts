// Cancelamento de aula pelo dashboard (so admin).
//
// LEITURA: GET  /api/admin-cancelamentos.php?unidade=&data=
// ESCRITA: POST /api/admin-cancelar.php e /api/admin-descancelar.php
//   uma aula:     { unidade, data, hora, modalidade }
//   dia inteiro:  { unidade, data, dia_inteiro: true }

import { enviar, obter } from './api';
import type { UnidadeSlug } from '../data/unidades';

export type AulaDoDia = { hora: string; modalidade: string; cancelada: boolean };
export type CancelamentoFuturo = { data: string; hora: string; modalidade: string };

export type DadosCancelamento = {
  hoje: string; // 'AAAA-MM-DD' (horario de Brasilia, do servidor)
  max: string; // ultimo dia que da pra cancelar (hoje + 60)
  aulas: AulaDoDia[];
  proximos: CancelamentoFuturo[];
};

export type Alvo =
  | { tipo: 'aula'; hora: string; modalidade: string }
  | { tipo: 'dia' };

const ehTexto = (v: unknown): v is string => typeof v === 'string';

export async function buscarCancelamentos(unidade: UnidadeSlug, data: string): Promise<DadosCancelamento> {
  const q = new URLSearchParams({ unidade, data });
  const d = await obter(`admin-cancelamentos.php?${q}`);
  if (!ehTexto(d.hoje) || !ehTexto(d.max) || !Array.isArray(d.aulas) || !Array.isArray(d.proximos)) {
    throw new Error('formato_invalido');
  }
  return {
    hoje: d.hoje,
    max: d.max,
    aulas: d.aulas.map((x: Record<string, unknown>) => ({
      hora: String(x.hora),
      modalidade: String(x.modalidade),
      cancelada: x.cancelada === true,
    })),
    proximos: d.proximos.map((x: Record<string, unknown>) => ({
      data: String(x.data),
      hora: String(x.hora),
      modalidade: String(x.modalidade),
    })),
  };
}

function corpo(unidade: UnidadeSlug, data: string, alvo: Alvo) {
  return alvo.tipo === 'dia'
    ? { unidade, data, dia_inteiro: true }
    : { unidade, data, hora: alvo.hora, modalidade: alvo.modalidade };
}

export async function cancelar(unidade: UnidadeSlug, data: string, alvo: Alvo): Promise<number> {
  const d = await enviar('admin-cancelar.php', corpo(unidade, data, alvo));
  return Number(d.cancelados) || 0;
}

export async function desfazerCancelamento(unidade: UnidadeSlug, data: string, alvo: Alvo): Promise<number> {
  const d = await enviar('admin-descancelar.php', corpo(unidade, data, alvo));
  return Number(d.desfeitos) || 0;
}

// --- datas no horario de Brasilia (o site e o servidor usam o mesmo) ------

// 'AAAA-MM-DD' de hoje em Sao Paulo, seja qual for o fuso do computador.
export function hojeNoSite(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

// "qui, 01/10"
export function nomeData(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  const semana = dt.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
  return `${semana}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}
