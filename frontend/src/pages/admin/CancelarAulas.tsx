// Bloco "Cancelar aula" dentro da aba Grade do dashboard.
//
// Escolhe a data (atalhos dos proximos 7 dias ou o calendario, ate 60 dias
// a frente), ve as aulas da grade PUBLICADA daquele dia e cancela uma por
// uma ou o dia inteiro (feriado). Desfazer volta a aula pro site na hora.
// Embaixo, a lista dos proximos cancelamentos da unidade.
//
// Usa a unidade que esta aberta no editor. Alteracao NAO salva no editor
// nao entra aqui: so vale o que ja esta no site.

import { useEffect, useState } from 'react';
import { ErroApi } from '../../lib/api';
import { unidades, type UnidadeSlug } from '../../data/unidades';
import {
  buscarCancelamentos,
  cancelar,
  desfazerCancelamento,
  hojeNoSite,
  nomeData,
  somarDias,
  type Alvo,
  type DadosCancelamento,
} from '../../lib/cancelamentos-store';

type Props = {
  unidade: UnidadeSlug;
  chave: number; // muda quando a grade e salva/publicada -> recarrega
  desativado: boolean; // previa sem API
  aoExpirar: () => void;
};

const MAX_DIAS = 60;

function CancelarAulas({ unidade, chave, desativado, aoExpirar }: Props) {
  const hoje = hojeNoSite();
  const [data, setData] = useState(hoje);
  const [recarga, setRecarga] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const ref = `${unidade}|${data}#${chave}.${recarga}`;
  const [resultado, setResultado] = useState<{ ref: string; dados: DadosCancelamento | null; erro: boolean }>({
    ref: '',
    dados: null,
    erro: false,
  });

  useEffect(() => {
    if (desativado) return;
    let ativo = true;
    buscarCancelamentos(unidade, data)
      .then((dados) => ativo && setResultado({ ref, dados, erro: false }))
      .catch((err) => {
        if (!ativo) return;
        if (err instanceof ErroApi && err.codigo === 'nao_autenticado') aoExpirar();
        else setResultado({ ref, dados: null, erro: true });
      });
    return () => {
      ativo = false;
    };
  }, [unidade, data, ref, desativado, aoExpirar]);

  const carregando = resultado.ref !== ref;
  const dados = carregando ? null : resultado.dados;
  const max = dados?.max ?? somarDias(hoje, MAX_DIAS);

  function escolherData(nova: string) {
    if (!nova) return;
    setData(nova);
    setMsg(null);
  }

  async function agir(acao: 'cancelar' | 'desfazer', alvo: Alvo, dia = data) {
    if (ocupado) return;
    if (alvo.tipo === 'dia') {
      const pergunta =
        acao === 'cancelar'
          ? `Cancelar TODAS as aulas de ${nomeData(dia)} na unidade ${unidades[unidade].nome}?\n\nO site mostra as aulas riscadas.`
          : `Voltar todas as aulas de ${nomeData(dia)} na unidade ${unidades[unidade].nome}?`;
      if (!confirm(pergunta)) return;
    }
    setOcupado(true);
    setMsg(null);
    try {
      if (acao === 'cancelar') {
        const n = await cancelar(unidade, dia, alvo);
        setMsg({
          tipo: 'ok',
          texto:
            alvo.tipo === 'dia'
              ? `${n} ${n === 1 ? 'aula cancelada' : 'aulas canceladas'} em ${nomeData(dia)}.`
              : `${alvo.hora} ${alvo.modalidade} cancelada em ${nomeData(dia)}.`,
        });
      } else {
        await desfazerCancelamento(unidade, dia, alvo);
        setMsg({
          tipo: 'ok',
          texto:
            alvo.tipo === 'dia'
              ? `Aulas de ${nomeData(dia)} de volta no site.`
              : `${alvo.hora} ${alvo.modalidade} de volta em ${nomeData(dia)}.`,
        });
      }
    } catch (err) {
      if (err instanceof ErroApi && err.codigo === 'nao_autenticado') return aoExpirar();
      setMsg({
        tipo: 'erro',
        texto:
          err instanceof ErroApi && err.detalhe
            ? err.detalhe
            : err instanceof ErroApi && err.codigo === 'sem_conexao'
              ? 'Sem conexão com o servidor. Nada foi alterado.'
              : 'Não foi possível concluir. Tente de novo.',
      });
    } finally {
      setOcupado(false);
      setRecarga((n) => n + 1);
    }
  }

  if (desativado) {
    return (
      <section className="admin__bloco">
        <h2 className="admin__bloco-titulo">Cancelar aula</h2>
        <p className="admin__vazio">Prévia: cancelar aula só funciona com o servidor.</p>
      </section>
    );
  }

  const atalhos = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i));
  const aulas = dados?.aulas ?? [];
  const algumaAtiva = aulas.some((a) => !a.cancelada);
  const algumaCancelada = aulas.some((a) => a.cancelada);
  const proximos = dados?.proximos ?? [];

  return (
    <section className="admin__bloco">
      <div className="admin__bloco-head">
        <h2 className="admin__bloco-titulo">Cancelar aula · {unidades[unidade].nome}</h2>
      </div>
      <p className="cancel__nota">
        Vale só para a data escolhida. Usa a grade que já está no site. A aula aparece riscada
        para os alunos quando a data estiver nos próximos 7 dias.
      </p>

      <div className="admin__abas" role="group" aria-label="Escolher a data">
        {atalhos.map((d, i) => (
          <button
            key={d}
            type="button"
            className={d === data ? 'admin__aba admin__aba--ativa' : 'admin__aba'}
            aria-pressed={d === data}
            onClick={() => escolherData(d)}
          >
            {i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : nomeData(d)}
          </button>
        ))}
        <label className="cancel__outra">
          <span>Outra data</span>
          <input
            type="date"
            min={hoje}
            max={max}
            value={data}
            onChange={(e) => escolherData(e.target.value)}
          />
        </label>
      </div>

      <h3 className="cancel__dia">{nomeData(data)}</h3>

      {msg && (
        <p
          className={msg.tipo === 'ok' ? 'cancel__msg' : 'cancel__msg cancel__msg--erro'}
          role={msg.tipo === 'erro' ? 'alert' : 'status'}
        >
          {msg.texto}
        </p>
      )}

      {carregando && <p className="admin__vazio">Carregando…</p>}
      {!carregando && resultado.erro && (
        <p className="admin__vazio" role="alert">
          Não foi possível carregar as aulas desse dia.
        </p>
      )}
      {dados && aulas.length === 0 && (
        <p className="admin__vazio">Nenhuma aula na grade publicada nesse dia da semana.</p>
      )}

      {aulas.length > 0 && (
        <>
          <ul className="cancel__lista">
            {aulas.map((a) => (
              <li
                key={`${a.hora}|${a.modalidade}`}
                className={a.cancelada ? 'cancel__aula cancel__aula--cancelada' : 'cancel__aula'}
              >
                <span className="cancel__hora">{a.hora}</span>
                <span className="cancel__nome">{a.modalidade}</span>
                {a.cancelada && <span className="cancel__tag">Cancelada</span>}
                <button
                  type="button"
                  className={a.cancelada ? 'admin__aba' : 'admin__remover'}
                  disabled={ocupado}
                  onClick={() =>
                    agir(a.cancelada ? 'desfazer' : 'cancelar', {
                      tipo: 'aula',
                      hora: a.hora,
                      modalidade: a.modalidade,
                    })
                  }
                >
                  {a.cancelada ? 'Desfazer' : 'Cancelar'}
                </button>
              </li>
            ))}
          </ul>
          <div className="cancel__dia-acoes">
            {algumaAtiva && (
              <button
                type="button"
                className="admin__remover"
                disabled={ocupado}
                onClick={() => agir('cancelar', { tipo: 'dia' })}
              >
                Cancelar o dia inteiro
              </button>
            )}
            {algumaCancelada && (
              <button
                type="button"
                className="admin__aba"
                disabled={ocupado}
                onClick={() => agir('desfazer', { tipo: 'dia' })}
              >
                Desfazer o dia inteiro
              </button>
            )}
          </div>
        </>
      )}

      <details className="cancel__proximos" open={proximos.length > 0 && proximos.length <= 10}>
        <summary>
          Próximos cancelamentos ({proximos.length})
        </summary>
        {proximos.length === 0 ? (
          <p className="admin__vazio">Nenhuma aula cancelada daqui pra frente.</p>
        ) : (
          <ul className="cancel__lista">
            {proximos.map((c) => (
              <li key={`${c.data}|${c.hora}|${c.modalidade}`} className="cancel__aula">
                <button type="button" className="cancel__ir" onClick={() => escolherData(c.data)}>
                  {nomeData(c.data)}
                </button>
                <span className="cancel__hora">{c.hora}</span>
                <span className="cancel__nome">{c.modalidade}</span>
                <button
                  type="button"
                  className="admin__aba"
                  disabled={ocupado}
                  onClick={() =>
                    agir('desfazer', { tipo: 'aula', hora: c.hora, modalidade: c.modalidade }, c.data)
                  }
                >
                  Desfazer
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}

export default CancelarAulas;
