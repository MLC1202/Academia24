import { useEffect, useState } from 'react';
import { slugsUnidades, type UnidadeSlug } from '../data/unidades';
import { enviar, SEM_API } from './api';

// Nota do Google de cada unidade, digitada pela equipe no painel.
// LEITURA (publica): GET /api/avaliacoes.php. GRAVAR (admin): POST /api/admin-avaliacao.php.

export type Notas = Partial<Record<UnidadeSlug, number>>;

const TEMPO_LIMITE_MS = 10_000;

export async function buscarNotas(): Promise<Notas> {
  const resposta = await fetch(`${import.meta.env.BASE_URL}api/avaliacoes.php`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  const dados: unknown = await resposta.json();
  if (typeof dados !== 'object' || dados === null) throw new Error('formato inesperado');

  const notas: Notas = {};
  for (const slug of slugsUnidades) {
    const nota = (dados as Record<string, unknown>)[slug];
    if (typeof nota === 'number' && nota >= 1 && nota <= 5) notas[slug] = nota;
  }
  return notas;
}

// Pras LPs: enquanto nao chega (ou se falhar), vale a nota escrita em
// lp/conteudo.ts, entao a pagina nunca fica sem nota.
export function useNotas(): Notas {
  const [notas, setNotas] = useState<Notas>({});

  useEffect(() => {
    if (SEM_API) return;
    let ativo = true;
    buscarNotas()
      .then((dados) => ativo && setNotas(dados))
      .catch((erro) => console.error('[avaliacoes] não foi possível carregar', erro));
    return () => {
      ativo = false;
    };
  }, []);

  return notas;
}

// 4.5 -> "4,5"
export const formatarNota = (nota: number) => nota.toFixed(1).replace('.', ',');

export async function salvarNota(unidade: UnidadeSlug, nota: string): Promise<number> {
  const dados = await enviar('admin-avaliacao.php', { unidade, nota });
  if (typeof dados.nota !== 'number') throw new Error('formato inesperado');
  return dados.nota;
}
