// Resumo dos leads por mes, dentro da aba Leads. So NUMEROS: nenhum nome,
// telefone ou e-mail sai do servidor pra montar isto.
//
// Mostra o mes atual + os 6 anteriores (mes sem lead aparece com zero):
// com retencao de 6 meses, e ai que esta tudo que existe no banco. O mais
// velho e "parcial" (o comeco dele ja foi apagado pela limpeza).
// Os status sao os de HOJE: um lead que foi contatado e depois matriculou
// conta so em "Matricularam".
// Atencao: lead excluido (pedido de exclusao ou limpeza dos 6 meses) some
// tambem destes numeros.

import { useEffect, useState } from 'react';
import { ErroApi } from '../../lib/api';
import { unidades, type UnidadeSlug } from '../../data/unidades';
import { buscarResumoLeads, type MesResumo } from '../../lib/leads-store';

type Props = {
  unidade: UnidadeSlug | '';
  chave: number; // muda quando um status muda / lead e excluido
  aoExpirar: () => void;
};

const MESES_NA_TELA = 7;

// 'AAAA-MM' dos ultimos N meses, do mais novo pro mais velho, no horario
// de Brasilia (igual ao servidor).
function ultimosMeses(n: number): string[] {
  const agora = new Date(Date.now() - 3 * 3600 * 1000); // UTC-3
  const lista: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - i, 1));
    lista.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return lista;
}

function nomeMes(mes: string) {
  const [a, m] = mes.split('-').map(Number);
  // "out/26"
  const nome = new Date(Date.UTC(a, m - 1, 1)).toLocaleString('pt-BR', {
    month: 'short',
    timeZone: 'UTC',
  });
  return `${nome.replace('.', '')}/${String(a).slice(2)}`;
}

function pct(parte: number, todo: number) {
  return todo === 0 ? '—' : `${Math.round((parte / todo) * 100)}%`;
}

const vazio = (mes: string): MesResumo => ({
  mes,
  recebidos: 0,
  novos: 0,
  contatados: 0,
  matricularam: 0,
  descartados: 0,
});

function ResumoLeads({ unidade, chave, aoExpirar }: Props) {
  const ref = `${unidade}#${chave}`;
  const [resultado, setResultado] = useState<{ ref: string; meses: MesResumo[] | null; erro: boolean }>({
    ref: '',
    meses: null,
    erro: false,
  });

  useEffect(() => {
    let ativo = true;
    buscarResumoLeads(unidade)
      .then(({ meses }) => ativo && setResultado({ ref, meses, erro: false }))
      .catch((err) => {
        if (!ativo) return;
        if (err instanceof ErroApi && err.codigo === 'nao_autenticado') aoExpirar();
        else setResultado({ ref, meses: null, erro: true });
      });
    return () => {
      ativo = false;
    };
  }, [unidade, ref, aoExpirar]);

  const carregando = resultado.ref !== ref;
  const doServidor = new Map((carregando ? [] : resultado.meses ?? []).map((m) => [m.mes, m]));
  const linhas = ultimosMeses(MESES_NA_TELA).map((mes) => doServidor.get(mes) ?? vazio(mes));
  const total = linhas.reduce(
    (t, l) => ({
      ...t,
      recebidos: t.recebidos + l.recebidos,
      novos: t.novos + l.novos,
      contatados: t.contatados + l.contatados,
      matricularam: t.matricularam + l.matricularam,
      descartados: t.descartados + l.descartados,
    }),
    vazio('total'),
  );

  return (
    <section className="admin__bloco">
      <div className="admin__bloco-head">
        <h2 className="admin__bloco-titulo">
          Resumo · {unidade ? unidades[unidade].nome : 'todas as unidades'}
        </h2>
      </div>

      {carregando && <p className="admin__vazio">Carregando…</p>}
      {!carregando && resultado.erro && (
        <p className="admin__vazio" role="alert">
          Não foi possível carregar o resumo.
        </p>
      )}

      {!carregando && !resultado.erro && (
        <>
          <div className="resumo__rolagem">
            <table className="resumo__tabela">
              <thead>
                <tr>
                  <th scope="col">Mês</th>
                  <th scope="col">Recebidos</th>
                  <th scope="col">Sem contato</th>
                  <th scope="col">Em contato</th>
                  <th scope="col">Matricularam</th>
                  <th scope="col">Descartados</th>
                  <th scope="col">Conversão</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr key={l.mes}>
                    <th scope="row">
                      {nomeMes(l.mes)}
                      {i === 0 && <span className="resumo__andamento"> (em andamento)</span>}
                      {i === linhas.length - 1 && <span className="resumo__andamento"> (parcial)</span>}
                    </th>
                    <td>{l.recebidos}</td>
                    <td>{l.novos}</td>
                    <td>{l.contatados}</td>
                    <td>{l.matricularam}</td>
                    <td>{l.descartados}</td>
                    <td className="resumo__conversao">{pct(l.matricularam, l.recebidos)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td>{total.recebidos}</td>
                  <td>{total.novos}</td>
                  <td>{total.contatados}</td>
                  <td>{total.matricularam}</td>
                  <td>{total.descartados}</td>
                  <td className="resumo__conversao">{pct(total.matricularam, total.recebidos)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="resumo__nota">
            Conversão = matricularam ÷ recebidos. Os status são os de hoje, então o mês atual
            ainda vai subir. Leads excluídos (a pedido ou pelos 6 meses) saem destes números.
          </p>
        </>
      )}
    </section>
  );
}

export default ResumoLeads;
