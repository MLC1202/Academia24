import { useEffect, useState } from 'react';
import {
  gradesPadrao,
  type GradeUnidade,
  type Grades,
} from '../data/grade';
import { slugsUnidades, type UnidadeSlug } from '../data/unidades';
// No GitHub Pages (previa pra dona) nao existe PHP: SEM_API liga a grade
// de exemplo em vez de dar erro.
import { enviar, SEM_API } from './api';

// Onde a grade e lida/salva. O resto do site so fala com este arquivo.
//
// LEITURA (site e dashboard): GET /api/grades.php.
// ESCRITA (so dashboard, logado): POST /api/admin-grade.php.

// ---------------------------------------------------------------------------
// Leitura: backend
// ---------------------------------------------------------------------------

// Aula cancelada numa data real (so vale aquela semana).
export type Cancelamento = {
  unidade: UnidadeSlug;
  data: string; // 'AAAA-MM-DD'
  hora: string; // 'HH:MM'
  modalidade: string;
};

export type DadosGrade = {
  grades: Grades;
  cancelamentos: Cancelamento[];
};

export type EstadoGrade =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; dados: DadosGrade };


// Se o servidor nao responder em 10 s, desiste e mostra o aviso.
const TEMPO_LIMITE_MS = 10_000;

// Confere o basico do que veio do servidor antes de usar. Se o formato
// estiver errado, e melhor mostrar o aviso do que quebrar a pagina.
function formatoValido(dados: unknown): dados is DadosGrade {
  if (typeof dados !== 'object' || dados === null) return false;
  const { grades, cancelamentos } = dados as Partial<DadosGrade>;
  return (
    typeof grades === 'object' &&
    grades !== null &&
    slugsUnidades.every((slug) => typeof grades[slug] === 'object') &&
    Array.isArray(cancelamentos)
  );
}

// semCache: o dashboard sempre quer a versao mais nova (o site pode usar a
// copia de ate 1 min que o navegador guarda).
export async function buscarGrades(semCache = false): Promise<DadosGrade> {
  if (SEM_API) return { grades: gradesPadrao, cancelamentos: [] };

  const resposta = await fetch(`${import.meta.env.BASE_URL}api/grades.php`, {
    headers: { Accept: 'application/json' },
    cache: semCache ? 'no-store' : 'default',
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

  const dados: unknown = await resposta.json();
  if (!formatoValido(dados)) throw new Error('formato inesperado');
  return dados;
}

// Hook pros componentes: devolve carregando / erro / pronto.
export function useGrades(): EstadoGrade {
  const [estado, setEstado] = useState<EstadoGrade>({ status: 'carregando' });

  useEffect(() => {
    let ativo = true; // se o componente sair da tela antes, ignora a resposta
    buscarGrades()
      .then((dados) => ativo && setEstado({ status: 'pronto', dados }))
      .catch((erro) => {
        console.error('[grade] não foi possível carregar', erro);
        if (ativo) setEstado({ status: 'erro' });
      });
    return () => {
      ativo = false;
    };
  }, []);

  return estado;
}

// ---------------------------------------------------------------------------
// Escrita: so admin logado (o backend confere sessao + CSRF)
// ---------------------------------------------------------------------------

// Manda a grade de UMA unidade. O servidor valida tudo de novo, grava como
// versao nova (a anterior fica guardada) e limpa o cache do site.
export async function salvarGrade(unidade: UnidadeSlug, grade: GradeUnidade) {
  const corpo = Object.fromEntries(
    Object.entries(grade).map(([dia, aulas]) => [
      dia,
      aulas.map(({ hora, modalidade }) => ({ hora, modalidade })),
    ]),
  );
  return enviar('admin-grade.php', { unidade, grade: corpo });
}
