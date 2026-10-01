// Transforma as abas lidas do .xlsx na grade de cada unidade.
//
// Formato esperado (o da planilha da Rede 24):
//   - uma aba por unidade, com o nome da unidade (ex.: "Alphaville", "Cambuí")
//   - uma linha de cabecalho com pelo menos: Dia | Horário | Aula
//     (pode estar em qualquer linha/coluna)
//   - colunas opcionais, usadas se existirem: Duração (min), Professor(a),
//     Categoria, Estúdio. Se um desses vier estranho, so ELE fica de fora
//     (com aviso) -- a aula entra mesmo assim.
//   - a coluna Observações e ignorada de proposito (anotacoes internas).
//   - uma aula por linha
// O que nao der pra entender vira AVISO (com o numero da linha) e a linha
// fica de fora -- nada e publicado sem a dona ver a previa.
//
// As regras de nome da aula sao as MESMAS do servidor (src/grade.php):
// se passar aqui, passa la.

import { gradeVazia, ordenarPorHora, type Aula, type Dia, type GradeUnidade } from '../../data/grade';
import { slugsUnidades, unidades, type UnidadeSlug } from '../../data/unidades';
import type { Aba, Celula } from './xlsx';

export type UnidadeLida = {
  slug: UnidadeSlug;
  aba: string;
  grade: GradeUnidade;
  total: number;
  avisos: string[];
};

export type Leitura = {
  unidades: UnidadeLida[];
  avisos: string[]; // avisos gerais (aba ignorada, unidade sem aba...)
};

const MODALIDADE_MAX = 60;
const NOME_VALIDO = /^[\p{L}\p{N} /\-&+.,()']+$/u;

// Mesmos limites do servidor (src/grade.php).
const DETALHES = {
  professor: { max: 60, regra: NOME_VALIDO, nome: 'professor' },
  categoria: { max: 40, regra: NOME_VALIDO, nome: 'categoria' },
  estudio: { max: 40, regra: NOME_VALIDO, nome: 'estúdio' },
} as const;
type CampoDetalhe = keyof typeof DETALHES;

// "Cambuí " -> "cambui"
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();
}

const DIAS: Record<string, Dia> = {
  seg: 'seg', ter: 'ter', qua: 'qua', qui: 'qui', sex: 'sex', sab: 'sab', dom: 'dom',
};

// "Segunda", "segunda-feira", "SEG" -> 'seg'
function lerDia(valor: Celula): Dia | null {
  if (typeof valor !== 'string') return null;
  return DIAS[normalizar(valor).slice(0, 3)] ?? null;
}

// "7:30", "07:30", "07:30:00", "7h30", "7h" ou hora do Excel (0.3125) -> "07:30"
function lerHora(valor: Celula): string | null {
  let h: number;
  let m: number;
  if (typeof valor === 'number') {
    if (!(valor >= 0 && valor < 1)) return null;
    const minutos = Math.round(valor * 24 * 60);
    h = Math.floor(minutos / 60);
    m = minutos % 60;
  } else if (typeof valor === 'string') {
    const r = valor.trim().toLowerCase().match(/^(\d{1,2})\s*[:h]\s*(\d{2})?(?::\d{2})?$/);
    if (!r) return null;
    h = Number(r[1]);
    m = Number(r[2] ?? 0);
  } else {
    return null;
  }
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function lerModalidade(valor: Celula): { nome: string } | { erro: string } | null {
  if (valor === null || valor === undefined) return null;
  const nome = String(valor).replace(/\s+/g, ' ').trim();
  if (!nome) return null;
  if (nome.length > MODALIDADE_MAX) return { erro: `nome da aula com mais de ${MODALIDADE_MAX} letras` };
  if (!NOME_VALIDO.test(nome)) return { erro: `nome da aula com caractere não permitido ("${nome.slice(0, 30)}")` };
  return { nome };
}

// Texto opcional: undefined se vazio, o texto se valido, ou { erro }.
function lerDetalhe(valor: Celula, campo: CampoDetalhe): string | undefined | { erro: string } {
  if (valor === null || valor === undefined) return undefined;
  const texto = String(valor).replace(/\s+/g, ' ').trim();
  if (!texto) return undefined;
  const { max, regra, nome } = DETALHES[campo];
  if (texto.length > max || !regra.test(texto)) return { erro: `${nome} ignorado (texto inválido ou longo demais)` };
  return texto;
}

// 60, "60", "60 min" -> 60
function lerDuracao(valor: Celula): number | undefined | { erro: string } {
  if (valor === null || valor === undefined || valor === '') return undefined;
  const n = typeof valor === 'number' ? valor : Number(String(valor).replace(/\s*min.*$/i, '').trim());
  if (!Number.isInteger(n) || n < 5 || n > 300) return { erro: 'duração ignorada (use minutos, de 5 a 300)' };
  return n;
}

// Qual unidade e esta aba? Compara com o slug e com o nome da unidade.
function unidadeDaAba(nomeAba: string): UnidadeSlug | null {
  const n = normalizar(nomeAba);
  return (
    slugsUnidades.find((slug) => n === slug || n.includes(normalizar(unidades[slug].nome)) || n.includes(slug)) ??
    null
  );
}

// Acha a linha de cabecalho (Dia / Horario / Aula) nas primeiras 20 linhas.
function acharCabecalho(linhas: Celula[][]) {
  for (let r = 0; r < Math.min(linhas.length, 20); r++) {
    const linha = linhas[r] ?? [];
    const col = (...nomes: string[]) =>
      linha.findIndex((c) => typeof c === 'string' && nomes.includes(normalizar(c)));
    const dia = col('dia', 'dia da semana');
    const hora = col('horario', 'hora', 'inicio');
    const aula = col('aula', 'modalidade', 'atividade');
    if (dia >= 0 && hora >= 0 && aula >= 0) {
      return {
        linha: r,
        dia,
        hora,
        aula,
        // opcionais (-1 = coluna nao existe)
        duracao: col('duracao (min)', 'duracao', 'duracao (minutos)', 'minutos'),
        professor: col('professor(a)', 'professor', 'professora', 'instrutor', 'instrutor(a)'),
        categoria: col('categoria', 'tipo'),
        estudio: col('estudio', 'studio', 'sala'),
      };
    }
  }
  return null;
}

function lerAba(aba: Aba, slug: UnidadeSlug): UnidadeLida {
  const avisos: string[] = [];
  const grade = gradeVazia();
  const cab = acharCabecalho(aba.linhas);
  if (!cab) {
    avisos.push('Não achei o cabeçalho com as colunas "Dia", "Horário" e "Aula". Nada foi lido desta aba.');
    return { slug, aba: aba.nome, grade, total: 0, avisos };
  }

  const vistas = new Set<string>();
  let total = 0;
  for (let r = cab.linha + 1; r < aba.linhas.length; r++) {
    const linha = aba.linhas[r];
    if (!linha || linha.every((c) => c === null || c === undefined || c === '')) continue;
    const numero = r + 1; // numero da linha como aparece no Excel

    const dia = lerDia(linha[cab.dia] ?? null);
    const hora = lerHora(linha[cab.hora] ?? null);
    const mod = lerModalidade(linha[cab.aula] ?? null);

    const problemas: string[] = [];
    if (!dia) problemas.push('dia não reconhecido');
    if (!hora) problemas.push('horário não reconhecido');
    if (!mod) problemas.push('aula sem nome');
    else if ('erro' in mod) problemas.push(mod.erro);
    if (problemas.length || !dia || !hora || !mod || 'erro' in mod) {
      avisos.push(`Linha ${numero}: ${problemas.join(', ')}. Linha ignorada.`);
      continue;
    }

    const chave = `${dia}|${hora}|${normalizar(mod.nome)}`;
    if (vistas.has(chave)) {
      avisos.push(`Linha ${numero}: aula repetida (mesmo dia, horário e nome). Mantive só uma.`);
      continue;
    }
    vistas.add(chave);
    // Detalhes: o que vier estranho fica de fora, a aula entra.
    const aulaNova: Aula = { id: `imp-${r}`, hora, modalidade: mod.nome };
    const ignorados: string[] = [];
    if (cab.duracao >= 0) {
      const d = lerDuracao(linha[cab.duracao] ?? null);
      if (typeof d === 'object') ignorados.push(d.erro);
      else if (d !== undefined) aulaNova.duracao = d;
    }
    for (const campo of Object.keys(DETALHES) as CampoDetalhe[]) {
      if (cab[campo] < 0) continue;
      const v = lerDetalhe(linha[cab[campo]] ?? null, campo);
      if (typeof v === 'object') ignorados.push(v.erro);
      else if (v !== undefined) aulaNova[campo] = v;
    }
    if (ignorados.length) avisos.push(`Linha ${numero}: ${ignorados.join(', ')}. A aula entrou mesmo assim.`);

    grade[dia].push(aulaNova);
    total++;
  }

  for (const d of Object.keys(grade) as Dia[]) grade[d] = ordenarPorHora(grade[d]);
  if (total === 0) avisos.push('Nenhuma aula válida nesta aba.');
  return { slug, aba: aba.nome, grade, total, avisos };
}

export function interpretarPlanilha(abas: Aba[]): Leitura {
  const avisos: string[] = [];
  const porSlug = new Map<UnidadeSlug, UnidadeLida>();

  for (const aba of abas) {
    const slug = unidadeDaAba(aba.nome);
    if (!slug) {
      avisos.push(`Aba "${aba.nome}" não corresponde a nenhuma unidade e foi ignorada.`);
      continue;
    }
    if (porSlug.has(slug)) {
      avisos.push(`Mais de uma aba para ${unidades[slug].nome}: usei só a primeira ("${porSlug.get(slug)!.aba}").`);
      continue;
    }
    porSlug.set(slug, lerAba(aba, slug));
  }

  for (const slug of slugsUnidades) {
    if (!porSlug.has(slug)) avisos.push(`Sem aba para ${unidades[slug].nome}: a grade dela não muda.`);
  }

  return { unidades: slugsUnidades.filter((s) => porSlug.has(s)).map((s) => porSlug.get(s)!), avisos };
}
