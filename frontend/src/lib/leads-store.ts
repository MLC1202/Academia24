// Leads do formulario de agendamento, do lado do dashboard (so admin).
//
// LEITURA: GET /api/admin-leads.php   (filtros: unidade, status, pagina)
// ESCRITA: POST /api/admin-lead-status.php e /api/admin-lead-excluir.php
// EXPORTAR: GET /api/admin-leads-exportar.php -> .xlsx montado aqui
//
// Dado pessoal: fica so na memoria da pagina. Nada em localStorage, console
// ou URL (o filtro na URL e so unidade/status, nunca nome ou e-mail).
// O .xlsx exportado sai do sistema: o servidor registra cada exportacao.

import { enviar, obter } from './api';
import { unidades, type UnidadeSlug } from '../data/unidades';
import { hojeNoSite } from './cancelamentos-store';
import { baixarArquivo, gerarXlsx, type Aba } from './planilha/xlsx-escrever';

export const statusLead = ['novo', 'contatado', 'matriculou', 'descartado'] as const;
export type StatusLead = (typeof statusLead)[number];

export const nomeStatus: Record<StatusLead, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  matriculou: 'Matriculou',
  descartado: 'Descartado',
};

export const nomePeriodo: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

export const nomeObjetivo: Record<string, string> = {
  saude: 'Saúde e qualidade de vida',
  emagrecimento: 'Emagrecimento',
  massamuscular: 'Ganho de massa muscular',
  condicionamento: 'Condicionamento físico',
  retomar: 'Retomar a rotina de treinos',
};

export type Lead = {
  id: number;
  unidade: UnidadeSlug;
  periodo: string;
  objetivo: string;
  nome: string;
  telefone: string; // so digitos
  email: string;
  status: StatusLead;
  criadoEm: Date;
  statusEm: Date | null; // ultima troca de status
};

export type PaginaLeads = {
  leads: Lead[];
  total: number;
  pagina: number;
  porPagina: number;
  contagem: Record<StatusLead, number>;
};

export type FiltroLeads = {
  unidade: UnidadeSlug | '';
  status: StatusLead | '';
  pagina: number;
};

function ehStatus(v: unknown): v is StatusLead {
  return typeof v === 'string' && (statusLead as readonly string[]).includes(v);
}

// Confere cada linha antes de usar: formato estranho vira erro, nao tela quebrada.
function lerLead(x: unknown): Lead {
  const l = x as Record<string, unknown>;
  if (
    typeof l?.id !== 'number' ||
    typeof l.nome !== 'string' ||
    typeof l.telefone !== 'string' ||
    typeof l.email !== 'string' ||
    typeof l.unidade !== 'string' ||
    typeof l.criado_em !== 'string' ||
    !ehStatus(l.status)
  ) {
    throw new Error('formato_invalido');
  }
  return {
    id: l.id,
    unidade: l.unidade as UnidadeSlug,
    periodo: String(l.periodo ?? ''),
    objetivo: String(l.objetivo ?? ''),
    nome: l.nome,
    telefone: l.telefone,
    email: l.email,
    status: l.status,
    criadoEm: new Date(l.criado_em),
    statusEm: typeof l.status_em === 'string' ? new Date(l.status_em) : null,
  };
}

export async function listarLeads(f: FiltroLeads): Promise<PaginaLeads> {
  const q = new URLSearchParams();
  if (f.unidade) q.set('unidade', f.unidade);
  if (f.status) q.set('status', f.status);
  q.set('pagina', String(f.pagina));
  const d = await obter(`admin-leads.php?${q}`);
  if (!Array.isArray(d.leads)) throw new Error('formato_invalido');
  const c = (d.contagem ?? {}) as Record<string, unknown>;
  return {
    leads: d.leads.map(lerLead),
    total: Number(d.total) || 0,
    pagina: Number(d.pagina) || 1,
    porPagina: Number(d.por_pagina) || 50,
    contagem: {
      novo: Number(c.novo) || 0,
      contatado: Number(c.contatado) || 0,
      matriculou: Number(c.matriculou) || 0,
      descartado: Number(c.descartado) || 0,
    },
  };
}

export async function mudarStatusLead(id: number, status: StatusLead): Promise<void> {
  await enviar('admin-lead-status.php', { id, status });
}

export async function excluirLead(id: number): Promise<void> {
  await enviar('admin-lead-excluir.php', { id });
}

// "11987654321" -> "(11) 98765-4321"
export function formatarTelefone(d: string): string {
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

// Link do WhatsApp so pra celular (11 digitos). Fixo nao tem WhatsApp.
export function linkWhatsapp(d: string): string | null {
  return /^\d{11}$/.test(d) ? `https://wa.me/55${d}` : null;
}

// --- Resumo (so numeros, nenhum dado pessoal) --------------------------------

export type MesResumo = {
  mes: string; // 'AAAA-MM' (horario de Brasilia)
  recebidos: number;
  novos: number;
  contatados: number;
  matricularam: number;
  descartados: number;
};

export async function buscarResumoLeads(
  unidade: UnidadeSlug | '',
): Promise<{ meses: MesResumo[]; retencaoMeses: number }> {
  const q = unidade ? `?unidade=${encodeURIComponent(unidade)}` : '';
  const d = await obter(`admin-leads-resumo.php${q}`);
  if (!Array.isArray(d.meses)) throw new Error('formato_invalido');
  const meses = d.meses.map((x: unknown): MesResumo => {
    const m = x as Record<string, unknown>;
    if (typeof m?.mes !== 'string') throw new Error('formato_invalido');
    return {
      mes: m.mes,
      recebidos: Number(m.recebidos) || 0,
      novos: Number(m.novos) || 0,
      contatados: Number(m.contatados) || 0,
      matricularam: Number(m.matricularam) || 0,
      descartados: Number(m.descartados) || 0,
    };
  });
  return { meses, retencaoMeses: Number(d.retencao_meses) || 6 };
}

// --- Exportar Excel ------------------------------------------------------------

// Conversao "real" = a equipe marcou "Matriculou" no dashboard (o site nao
// sabe de matricula feita por fora). Descartado = nao converteu.
const conversao: Record<StatusLead, string> = {
  matriculou: 'Sim',
  descartado: 'Não',
  novo: 'Em andamento',
  contatado: 'Em andamento',
};

// 'AAAA-MM-DD' no horario de Brasilia.
function diaNoSite(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
}

// Dias de calendario entre o pedido e a matricula (mesmo dia = 0).
function diasEntre(inicio: Date, fim: Date): number {
  return Math.max(0, Math.round((Date.parse(diaNoSite(fim)) - Date.parse(diaNoSite(inicio))) / 86_400_000));
}

const colunasExportacao = [
  { titulo: 'Recebido em', largura: 17 },
  { titulo: 'Nome', largura: 28 },
  { titulo: 'Telefone', largura: 17 },
  { titulo: 'E-mail', largura: 30 },
  { titulo: 'Unidade', largura: 13 },
  { titulo: 'Período', largura: 10 },
  { titulo: 'Objetivo', largura: 27 },
  { titulo: 'Status', largura: 13 },
  { titulo: 'Conversão', largura: 14 },
  { titulo: 'Matriculou em', largura: 17 },
  { titulo: 'Dias até matricular', largura: 19 },
];

// Busca TODOS os leads do filtro, monta o .xlsx e baixa.
// Devolve quantos foram e se bateu no limite do servidor.
export async function exportarLeads(
  f: Pick<FiltroLeads, 'unidade' | 'status'>,
): Promise<{ quantidade: number; noLimite: boolean }> {
  const q = new URLSearchParams();
  if (f.unidade) q.set('unidade', f.unidade);
  if (f.status) q.set('status', f.status);
  const d = await obter(`admin-leads-exportar.php?${q}`);
  if (!Array.isArray(d.leads)) throw new Error('formato_invalido');
  const leads = d.leads.map(lerLead);

  const aba: Aba = {
    nome: 'Leads',
    colunas: colunasExportacao,
    linhas: leads.map((l: Lead) => {
      const matricula = l.status === 'matriculou' ? l.statusEm : null;
      return [
        l.criadoEm,
        l.nome,
        formatarTelefone(l.telefone),
        l.email,
        unidades[l.unidade]?.nome ?? l.unidade,
        nomePeriodo[l.periodo] ?? l.periodo,
        nomeObjetivo[l.objetivo] ?? l.objetivo,
        nomeStatus[l.status],
        conversao[l.status],
        matricula,
        matricula ? diasEntre(l.criadoEm, matricula) : null,
      ];
    }),
  };

  baixarArquivo(gerarXlsx(aba), `leads-${f.unidade || 'todas'}-${f.status || 'todos'}-${hojeNoSite()}.xlsx`);
  return { quantidade: leads.length, noLimite: leads.length >= (Number(d.limite) || Infinity) };
}
