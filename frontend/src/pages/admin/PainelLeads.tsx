// Aba "Leads" do dashboard: quem pediu aula experimental pelo site.
//
// Filtra por unidade e status, muda o status (novo -> contatado -> ...) e
// exclui. Excluir apaga DE VERDADE (LGPD: e assim que se atende um pedido
// de exclusao). O que sobra no log e so o numero do lead.
//
// Os dados pessoais so ficam na memoria desta tela.

import { useEffect, useState } from 'react';
import { ErroApi, SEM_API } from '../../lib/api';
import { slugsUnidades, unidades } from '../../data/unidades';
import {
  excluirLead,
  formatarTelefone,
  linkWhatsapp,
  listarLeads,
  mudarStatusLead,
  nomeObjetivo,
  nomePeriodo,
  nomeStatus,
  statusLead,
  type FiltroLeads,
  type Lead,
  type PaginaLeads,
  type StatusLead,
} from '../../lib/leads-store';
import ResumoLeads from './ResumoLeads';
import './PainelLeads.css';

type Props = { aoExpirar: () => void };

function quando(d: Date) {
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PainelLeads({ aoExpirar }: Props) {
  const [filtro, setFiltro] = useState<FiltroLeads>({ unidade: '', status: '', pagina: 1 });
  // Muda depois de mudar status/excluir -> a lista recarrega.
  const [chave, setChave] = useState(0);
  // A busca guarda pra qual filtro ela vale; se nao bater, mostra "carregando".
  const [resultado, setResultado] = useState<{ ref: string; dados: PaginaLeads | null; erro: boolean }>({
    ref: '',
    dados: null,
    erro: false,
  });
  const [ocupado, setOcupado] = useState<number | null>(null); // id em acao
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const ref = `${filtro.unidade}|${filtro.status}|${filtro.pagina}#${chave}`;

  useEffect(() => {
    if (SEM_API) return;
    let ativo = true;
    listarLeads(filtro)
      .then((dados) => ativo && setResultado({ ref, dados, erro: false }))
      .catch((err) => {
        if (!ativo) return;
        if (err instanceof ErroApi && err.codigo === 'nao_autenticado') aoExpirar();
        else setResultado({ ref, dados: null, erro: true });
      });
    return () => {
      ativo = false;
    };
  }, [filtro, ref, aoExpirar]);

  const carregando = resultado.ref !== ref;
  const dados = carregando ? null : resultado.dados;

  function filtrar(mudanca: Partial<FiltroLeads>) {
    setFiltro((f) => ({ ...f, pagina: 1, ...mudanca }));
    setMsg(null);
  }

  function falhou(err: unknown, padrao: string) {
    if (err instanceof ErroApi && err.codigo === 'nao_autenticado') return aoExpirar();
    const texto =
      err instanceof ErroApi && err.detalhe
        ? err.detalhe
        : err instanceof ErroApi && err.codigo === 'sem_conexao'
          ? 'Sem conexão com o servidor. Nada foi alterado.'
          : padrao;
    setMsg({ tipo: 'erro', texto });
    setChave((n) => n + 1); // recarrega pra mostrar o estado real
  }

  async function trocarStatus(lead: Lead, status: StatusLead) {
    if (status === lead.status) return;
    setOcupado(lead.id);
    setMsg(null);
    try {
      await mudarStatusLead(lead.id, status);
      setMsg({ tipo: 'ok', texto: `${lead.nome}: ${nomeStatus[status].toLowerCase()}.` });
      setChave((n) => n + 1);
    } catch (err) {
      falhou(err, 'Não foi possível mudar o status. Tente de novo.');
    } finally {
      setOcupado(null);
    }
  }

  async function excluir(lead: Lead) {
    const ok = confirm(
      `Excluir o lead de ${lead.nome}?\n\nOs dados são apagados de vez e não dá para desfazer. ` +
        'Use quando a pessoa pedir a exclusão ou quando o contato não interessar mais.',
    );
    if (!ok) return;
    setOcupado(lead.id);
    setMsg(null);
    try {
      await excluirLead(lead.id);
      setMsg({ tipo: 'ok', texto: 'Lead excluído.' });
      // Se era o ultimo da pagina, volta uma pagina.
      if (dados && dados.leads.length === 1 && filtro.pagina > 1) {
        setFiltro((f) => ({ ...f, pagina: f.pagina - 1 }));
      } else {
        setChave((n) => n + 1);
      }
    } catch (err) {
      falhou(err, 'Não foi possível excluir. Tente de novo.');
    } finally {
      setOcupado(null);
    }
  }

  if (SEM_API) {
    return (
      <p className="admin__aviso">
        Prévia: os leads só aparecem com o servidor. Nenhum dado real aqui.
      </p>
    );
  }

  const totalStatus = dados ? statusLead.reduce((s, st) => s + dados.contagem[st], 0) : 0;
  const paginas = dados ? Math.max(1, Math.ceil(dados.total / dados.porPagina)) : 1;

  return (
    <>
      <p className="admin__aviso">
        Pedidos de aula experimental feitos pelo site. São dados pessoais: use só para
        o contato. Leads com mais de <strong>6 meses</strong> são apagados sozinhos.
      </p>

      <section className="admin__bloco">
        <h2 className="admin__bloco-titulo">Unidade</h2>
        <div className="admin__abas">
          <button
            type="button"
            className={filtro.unidade === '' ? 'admin__aba admin__aba--ativa' : 'admin__aba'}
            onClick={() => filtrar({ unidade: '' })}
          >
            Todas
          </button>
          {slugsUnidades.map((slug) => (
            <button
              key={slug}
              type="button"
              className={filtro.unidade === slug ? 'admin__aba admin__aba--ativa' : 'admin__aba'}
              onClick={() => filtrar({ unidade: slug })}
            >
              {unidades[slug].nome}
            </button>
          ))}
        </div>

        <h2 className="admin__bloco-titulo leads__subtitulo">Status</h2>
        <div className="admin__abas">
          <button
            type="button"
            className={filtro.status === '' ? 'admin__aba admin__aba--ativa' : 'admin__aba'}
            onClick={() => filtrar({ status: '' })}
          >
            Todos
            {dados && <span className="admin__aba-contador">{totalStatus}</span>}
          </button>
          {statusLead.map((st) => (
            <button
              key={st}
              type="button"
              className={filtro.status === st ? 'admin__aba admin__aba--ativa' : 'admin__aba'}
              onClick={() => filtrar({ status: st })}
            >
              {nomeStatus[st]}
              {dados && <span className="admin__aba-contador">{dados.contagem[st]}</span>}
            </button>
          ))}
        </div>
      </section>

      <ResumoLeads unidade={filtro.unidade} chave={chave} aoExpirar={aoExpirar} />

      <section className="admin__bloco">
        <div className="admin__bloco-head">
          <h2 className="admin__bloco-titulo">
            {dados ? `${dados.total} ${dados.total === 1 ? 'lead' : 'leads'}` : 'Leads'}
          </h2>
          <button type="button" className="admin__link" onClick={() => setChave((n) => n + 1)}>
            Atualizar
          </button>
        </div>

        {msg && (
          <p
            className={msg.tipo === 'ok' ? 'leads__msg' : 'leads__msg leads__msg--erro'}
            role={msg.tipo === 'erro' ? 'alert' : 'status'}
          >
            {msg.texto}
          </p>
        )}

        {carregando && <p className="admin__vazio">Carregando…</p>}
        {!carregando && resultado.erro && (
          <p className="admin__vazio" role="alert">
            Não foi possível carregar os leads. Tente “Atualizar”.
          </p>
        )}
        {dados && dados.leads.length === 0 && (
          <p className="admin__vazio">Nenhum lead com esse filtro.</p>
        )}

        {dados && dados.leads.length > 0 && (
          <ul className="leads__lista">
            {dados.leads.map((lead) => {
              const zap = linkWhatsapp(lead.telefone);
              return (
                <li key={lead.id} className="leads__item">
                  <div className="leads__topo">
                    <strong className="leads__nome">{lead.nome}</strong>
                    <span className={`leads__selo leads__selo--${lead.status}`}>
                      {nomeStatus[lead.status]}
                    </span>
                  </div>
                  <p className="leads__info">
                    {quando(lead.criadoEm)} · {unidades[lead.unidade]?.nome ?? lead.unidade} ·{' '}
                    {nomePeriodo[lead.periodo] ?? lead.periodo} ·{' '}
                    {nomeObjetivo[lead.objetivo] ?? lead.objetivo}
                  </p>
                  <p className="leads__contato">
                    <a href={`tel:+55${lead.telefone}`}>{formatarTelefone(lead.telefone)}</a>
                    {zap && (
                      <a href={zap} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>
                    )}
                    <a href={`mailto:${lead.email}`}>{lead.email}</a>
                  </p>
                  <div className="leads__acoes">
                    <label className="leads__status">
                      <span>Status</span>
                      <select
                        value={lead.status}
                        disabled={ocupado !== null}
                        onChange={(e) => trocarStatus(lead, e.target.value as StatusLead)}
                      >
                        {statusLead.map((st) => (
                          <option key={st} value={st}>
                            {nomeStatus[st]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="admin__remover"
                      disabled={ocupado !== null}
                      onClick={() => excluir(lead)}
                    >
                      {ocupado === lead.id ? 'Aguarde…' : 'Excluir'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {dados && paginas > 1 && (
          <div className="leads__paginas">
            <button
              type="button"
              className="admin__aba"
              disabled={filtro.pagina <= 1}
              onClick={() => setFiltro((f) => ({ ...f, pagina: f.pagina - 1 }))}
            >
              ← Anterior
            </button>
            <span>
              Página {filtro.pagina} de {paginas}
            </span>
            <button
              type="button"
              className="admin__aba"
              disabled={filtro.pagina >= paginas}
              onClick={() => setFiltro((f) => ({ ...f, pagina: f.pagina + 1 }))}
            >
              Próxima →
            </button>
          </div>
        )}
      </section>
    </>
  );
}

export default PainelLeads;
