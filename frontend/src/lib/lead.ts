import type { UnidadeSlug } from '../unidades';

/** O que a pessoa quer quando clica num botão dentro da LP da unidade. */
export type Interesse = 'aula' | 'planos';

type Base = {
  nome: string;
  whatsapp: string;
  unidade: UnidadeSlug;
  /** De onde veio: '/' ou '/unidades/alphaville'. */
  origem: string;
  criadoEm: string;
};

/**
 * Formulário da home: a pessoa ainda está escolhendo.
 * Interessa saber unidade, objetivo de treino e período.
 */
export type LeadRede = Base & {
  tipo: 'rede';
  email: string;
  objetivo: string;
  periodo: string;
};

/**
 * Formulário da unidade: a pessoa já escolheu.
 * Só identifica quem é e por que veio — o interesse vem do botão clicado.
 */
export type LeadUnidade = Base & {
  tipo: 'unidade';
  interesse: Interesse;
};

export type Lead = LeadRede | LeadUnidade;

/**
 * ================== PONTO DE LIGAÇÃO DO BANCO ==================
 * Hoje só registra no console — o front já funciona inteiro.
 * Quando o endpoint da Hostinger existir, troque o corpo desta
 * função. Nenhum componente precisa mudar.
 *
 *   const resposta = await fetch('/api/leads.php', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(lead),
 *   });
 *   if (!resposta.ok) throw new Error('Falha ao salvar o lead');
 *
 * Sugestão de tabela: uma só, com a coluna `tipo` ('rede' | 'unidade')
 * e as colunas que não se aplicam ficando nulas. Fica mais simples
 * para o dashboard ler tudo junto do que manter duas tabelas.
 * ===============================================================
 */
export async function enviarLead(lead: Lead): Promise<void> {
  console.info('[lead]', lead);
}
