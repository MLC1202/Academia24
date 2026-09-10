import {
  gradesPadrao,
  type GradeUnidade,
  type Grades,
} from '../grade';
import { slugsUnidades, type UnidadeSlug } from '../unidades';

// Nome da chave no localStorage.
const CHAVE = 'academia24:grades';

// AQUI E ONDE EU PLUGO O BANCO DEPOIS.
//
// Por enquanto a grade editada fica no localStorage do navegador. Serve pra
// desenvolver e testar, mas NAO serve em producao: cada navegador tem o seu,
// entao o que eu edito aqui nao aparece pra quem visita o site.
//
// Quando o endpoint existir, essas duas funcoes viram:
//   carregarGrades -> GET  /api/grades.php
//   salvarGrade    -> POST /api/grades.php  { unidade, grade }
//
// O resto do site nao muda: a home e o dashboard so falam com este arquivo.

// Le o que estiver salvo e completa com a grade de exemplo o que faltar.
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
