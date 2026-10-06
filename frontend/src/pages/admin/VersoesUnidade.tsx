// "Qual versao da grade esta no site" + botao de voltar pra anterior +
// historico curto. Fica embaixo das abas de unidade no dashboard.
//
// Desfazer NAO apaga nada: so troca qual versao esta no ar. A que saiu
// continua no historico (e um novo "Salvar"/"Publicar" cria outra versao).

import { useEffect, useState } from 'react';
import { unidades, type UnidadeSlug } from '../../data/unidades';
import { ErroApi } from '../../lib/api';
import { desfazerUnidade, listarVersoes, type Versao } from '../../lib/grade-store';

type Props = {
  unidade: UnidadeSlug;
  chave: number; // muda quando a grade foi salva/publicada -> recarrega
  desativado: boolean; // previa sem API
  temAlteracao: boolean; // edicao nao salva no editor
  aoMudar: () => void; // dashboard recarrega a grade
  aoExpirar: () => void;
};

const ORIGEM: Record<Versao['origem'], string> = {
  upload: 'planilha',
  edicao: 'editor',
  seed: 'exemplo',
};

function quando(d: Date) {
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function descrever(v: Versao) {
  return `${quando(v.criadaEm)} · ${ORIGEM[v.origem] ?? v.origem} · ${v.aulas} ${v.aulas === 1 ? 'aula' : 'aulas'}`;
}

function VersoesUnidade({ unidade, chave, desativado, temAlteracao, aoMudar, aoExpirar }: Props) {
  // A busca guarda pra qual unidade/chave ela vale: se nao bater com a atual,
  // a tela mostra "carregando" sem precisar de setState dentro do efeito.
  const [resultado, setResultado] = useState<{ ref: string; versoes: Versao[] | null; erro: boolean }>({
    ref: '',
    versoes: null,
    erro: false,
  });
  const [voltando, setVoltando] = useState(false);
  const [msg, setMsg] = useState('');
  const ref = `${unidade}#${chave}`;

  useEffect(() => {
    if (desativado) return;
    let ativo = true;
    listarVersoes(unidade)
      .then((versoes) => ativo && setResultado({ ref, versoes, erro: false }))
      .catch((err) => {
        if (!ativo) return;
        if (err instanceof ErroApi && err.codigo === 'nao_autenticado') aoExpirar();
        else setResultado({ ref, versoes: null, erro: true });
      });
    return () => {
      ativo = false;
    };
  }, [unidade, chave, desativado, ref, aoExpirar]);

  if (desativado) return null;
  const atual = resultado.ref === ref ? resultado : null;
  if (!atual) return <p className="versoes versoes--carregando">Carregando histórico…</p>;
  if (atual.erro || !atual.versoes) return <p className="versoes">Não foi possível carregar o histórico.</p>;

  const lista = atual.versoes;
  const ativa = lista.find((v) => v.ativa) ?? null;
  // A que estava no ar antes da atual (o servidor marca): voltar no tempo,
  // nao "a de numero menor".
  const anterior = lista.find((v) => v.desfazer);

  async function voltar() {
    if (!anterior || voltando) return;
    const aviso = temAlteracao ? '\nAs alterações não salvas no editor serão descartadas.' : '';
    if (!confirm(`Voltar a grade de ${unidades[unidade].nome} para a versão de ${descrever(anterior)}?\nA versão atual continua guardada no histórico.${aviso}`)) return;
    setVoltando(true);
    setMsg('');
    try {
      await desfazerUnidade(unidade);
      setMsg('Pronto: a versão anterior já está no site.');
      aoMudar();
    } catch (err) {
      if (err instanceof ErroApi && err.codigo === 'nao_autenticado') return aoExpirar();
      setMsg(err instanceof ErroApi && err.detalhe ? err.detalhe : 'Não foi possível voltar. Tente de novo.');
    } finally {
      setVoltando(false);
    }
  }

  return (
    <div className="versoes">
      <p className="versoes__atual">
        <span>No site agora:</span> {ativa ? descrever(ativa) : 'nenhuma grade publicada'}
      </p>
      <div className="versoes__acoes">
        <button type="button" className="admin__sair" onClick={voltar} disabled={!anterior || voltando}>
          {voltando ? 'Voltando…' : 'Voltar para a versão anterior'}
        </button>
        {anterior && <span className="versoes__anterior">({descrever(anterior)})</span>}
      </div>
      {msg && <p className="versoes__msg" role="status">{msg}</p>}
      {lista.length > 1 && (
        <details className="versoes__historico">
          <summary>Histórico ({lista.length} últimas)</summary>
          <ol>
            {lista.map((v) => (
              <li key={v.id} className={v.ativa ? 'versoes__item--ativa' : undefined}>
                {descrever(v)}
                {v.ativa && <strong> · no site</strong>}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

export default VersoesUnidade;
