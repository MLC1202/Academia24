import { useEffect, useState } from 'react';
import {
  gradesPadrao,
  type GradeUnidade,
  type Grades,
} from '../data/grade';
import { slugsUnidades, type UnidadeSlug } from '../data/unidades';
// No GitHub Pages (previa pra dona) nao existe PHP: SEM_API liga a grade
// de exemplo em vez de dar erro.
import { SEM_API } from './api';

// Onde a grade e lida/salva. O resto do site so fala com este arquivo.
//
// LEITURA (site publico): vem do backend, GET /api/grades.php.
// ESCRITA (dashboard): por enquanto ainda no localStorage deste navegador.
// Vira POST pro backend quando existir login -- gravar sem login seria
// deixar qualquer pessoa trocar a grade do site.

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

export async function buscarGrades(): Promise<DadosGrade> {
  if (SEM_API) return { grades: gradesPadrao, cancelamentos: [] };

  const resposta = await fetch(`${import.meta.env.BASE_URL}api/grades.php`, {
    headers: { Accept: 'application/json' },
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
// Escrita: localStorage (TEMPORARIO, so o dashboard usa)
// ---------------------------------------------------------------------------

const CHAVE = 'academia24:grades';

// Le o que estiver salvo neste navegador e completa com a grade de exemplo.
export function carregarGrades(): Grades {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (!salvo) return gradesPadrao;

    const parcial = JSON.parse(salvo) as Partial<Grades>;
    const grades = { ...gradesPadrao };
    for (const slug of slugsUnidades) {
      const grade = parcial[slug];
      if (grade) grades[slug] = grade;
    }
    return grades;
  } catch (erro) {
    console.error('[grade] não foi possível ler o que estava salvo', erro);
    return gradesPadrao;
  }
}

// Salva a grade de UMA unidade, preservando as outras.
export function salvarGrade(unidade: UnidadeSlug, grade: GradeUnidade) {
  const grades = carregarGrades();
  grades[unidade] = grade;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(grades));
  } catch (erro) {
    console.error('[grade] não foi possível salvar', erro);
    throw erro;
  }
}
