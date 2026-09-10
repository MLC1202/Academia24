import {
  gradesPadrao,
  type GradeUnidade,
  type Grades,
} from '../grade';
import { slugsUnidades, type UnidadeSlug } from '../unidades';

const CHAVE = 'academia24:grades';

/**
 * ================== PONTO DE LIGAÇÃO DO BANCO ==================
 * Hoje a grade editada fica no localStorage do navegador, o que serve
 * para desenvolver e testar. NÃO serve em produção: o que você edita
 * aqui não aparece para os visitantes, porque cada navegador tem o seu.
 *
 * Quando o endpoint existir, estas duas funções viram:
 *
 *   carregarGrades: GET  /api/grades.php   -> Grades
 *   salvarGrade:    POST /api/grades.php   { unidade, grade }
 *
 * O resto do site não muda: a home e o dashboard só falam com daqui.
 * ===============================================================
 */

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
