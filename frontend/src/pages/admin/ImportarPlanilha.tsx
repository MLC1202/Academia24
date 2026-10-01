// Importar a grade a partir da planilha .xlsx (uma aba por unidade).
//
// Fluxo: escolher arquivo -> o NAVEGADOR le e mostra a previa (com avisos
// por linha) -> a dona marca quais unidades publicar -> Publicar.
// O arquivo nunca sai do computador dela: so as aulas ja interpretadas vao
// pra API, pelo mesmo caminho seguro do "Salvar grade" (login + CSRF +
// validacao no servidor + versao nova, com a anterior guardada).

import { useState, type ChangeEvent } from 'react';
import { dias } from '../../data/grade';
import { unidades, type UnidadeSlug } from '../../data/unidades';
import { ErroApi } from '../../lib/api';
import { salvarGrade } from '../../lib/grade-store';
import { interpretarPlanilha, type Leitura } from '../../lib/planilha/grade';
import { ErroPlanilha, lerXlsx } from '../../lib/planilha/xlsx';
import './ImportarPlanilha.css';

type Props = {
  desativado: boolean; // previa sem API
  antesDePublicar: () => boolean; // dashboard confirma se ha edicao nao salva
  aoPublicar: () => void; // dashboard recarrega a grade
  aoExpirar: () => void; // sessao venceu
};

type Status = { tipo: 'ok' | 'erro'; texto: string };

function ImportarPlanilha({ desativado, antesDePublicar, aoPublicar, aoExpirar }: Props) {
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [lendo, setLendo] = useState(false);
  const [leitura, setLeitura] = useState<Leitura | null>(null);
  const [erroLeitura, setErroLeitura] = useState('');
  const [marcadas, setMarcadas] = useState<Set<UnidadeSlug>>(new Set());
  const [publicando, setPublicando] = useState(false);
  const [status, setStatus] = useState<Partial<Record<UnidadeSlug, Status>>>({});

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    setNomeArquivo(arquivo.name);
    setLeitura(null);
    setErroLeitura('');
    setStatus({});
    if (!arquivo.name.toLowerCase().endsWith('.xlsx')) {
      setErroLeitura('Escolha um arquivo .xlsx (Excel). PDF, imagem ou .xls antigo não funcionam.');
      return;
    }
    setLendo(true);
    try {
      const resultado = interpretarPlanilha(await lerXlsx(arquivo));
      setLeitura(resultado);
      // Ja deixo marcadas as unidades que tem pelo menos 1 aula valida.
      setMarcadas(new Set(resultado.unidades.filter((u) => u.total > 0).map((u) => u.slug)));
    } catch (err) {
      setErroLeitura(
        err instanceof ErroPlanilha ? err.message : 'Não consegui ler esse arquivo. Confira se é a planilha da grade em .xlsx.',
      );
    } finally {
      setLendo(false);
    }
  }

  function alternar(slug: UnidadeSlug) {
    setMarcadas((m) => {
      const nova = new Set(m);
      if (nova.has(slug)) nova.delete(slug);
      else nova.add(slug);
      return nova;
    });
  }

  async function publicar() {
    if (!leitura || !marcadas.size || publicando || desativado) return;
    if (!antesDePublicar()) return;
    const nomes = leitura.unidades.filter((u) => marcadas.has(u.slug)).map((u) => unidades[u.slug].nome);
    if (!confirm(`Publicar a grade nova de: ${nomes.join(', ')}?\nA grade atual dessas unidades sai do site (fica guardada).`)) return;

    setPublicando(true);
    const novo: Partial<Record<UnidadeSlug, Status>> = {};
    let algumaOk = false;
    // Uma unidade por vez: se uma falhar, as outras continuam.
    for (const u of leitura.unidades) {
      if (!marcadas.has(u.slug)) continue;
      try {
        await salvarGrade(u.slug, u.grade, 'upload');
        novo[u.slug] = { tipo: 'ok', texto: 'Publicada' };
        algumaOk = true;
      } catch (err) {
        if (err instanceof ErroApi && err.codigo === 'nao_autenticado') {
          setPublicando(false);
          aoExpirar();
          return;
        }
        novo[u.slug] = {
          tipo: 'erro',
          texto: err instanceof ErroApi && err.detalhe ? err.detalhe : 'Não foi publicada. Tente de novo.',
        };
      }
      setStatus({ ...novo });
    }
    setPublicando(false);
    if (algumaOk) aoPublicar();
  }

  return (
    <section className="admin__bloco importar">
      <div className="admin__bloco-head">
        <h2 className="admin__bloco-titulo">Importar planilha</h2>
      </div>
      <p className="importar__texto">
        Escolha a planilha da grade (.xlsx, uma aba por unidade, com as colunas Dia, Horário e Aula).
        Você confere tudo antes de publicar.
      </p>

      <label className={`importar__arquivo${desativado ? ' importar__arquivo--off' : ''}`}>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={escolher}
          disabled={lendo || publicando || desativado}
        />
        <span>{lendo ? 'Lendo…' : nomeArquivo ? 'Escolher outro arquivo' : 'Escolher arquivo .xlsx'}</span>
        {nomeArquivo && !lendo && <small>{nomeArquivo}</small>}
      </label>

      {erroLeitura && <p className="admin__estado-erro importar__erro" role="alert">{erroLeitura}</p>}

      {leitura && (
        <>
          {leitura.avisos.length > 0 && (
            <ul className="importar__avisos">
              {leitura.avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}

          <div className="importar__unidades">
            {leitura.unidades.map((u) => {
              const st = status[u.slug];
              return (
                <article key={u.slug} className="importar__unidade">
                  <header className="importar__unidade-topo">
                    <label className="importar__marcar">
                      <input
                        type="checkbox"
                        checked={marcadas.has(u.slug)}
                        disabled={u.total === 0 || publicando}
                        onChange={() => alternar(u.slug)}
                      />
                      <strong>{unidades[u.slug].nome}</strong>
                    </label>
                    <span className="importar__total">
                      {u.total} {u.total === 1 ? 'aula' : 'aulas'} · aba "{u.aba}"
                    </span>
                    {st && <span className={`importar__status importar__status--${st.tipo}`}>{st.texto}</span>}
                  </header>

                  <div className="importar__dias">
                    {dias.map((d) => (
                      <span key={d.chave} className="importar__dia">
                        {d.curto} <b>{u.grade[d.chave].length}</b>
                      </span>
                    ))}
                  </div>

                  {u.avisos.length > 0 && (
                    <details className="importar__detalhe" open>
                      <summary>{u.avisos.length} aviso(s)</summary>
                      <ul>
                        {u.avisos.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <details className="importar__detalhe">
                    <summary>Ver aulas</summary>
                    <div className="importar__tabela">
                      {dias.map((d) => (
                        <div key={d.chave}>
                          <h4>{d.longo}</h4>
                          {u.grade[d.chave].length === 0 ? (
                            <p>—</p>
                          ) : (
                            <ul>
                              {u.grade[d.chave].map((a) => (
                                <li key={a.id}>
                                  <span>{a.hora}</span> {a.modalidade}
                                  {(a.duracao || a.professor) && (
                                    <small>
                                      {[a.duracao && `${a.duracao} min`, a.professor].filter(Boolean).join(' · ')}
                                    </small>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className="admin__salvar importar__publicar"
            disabled={!marcadas.size || publicando || desativado}
            onClick={publicar}
          >
            {publicando
              ? 'Publicando…'
              : `Publicar ${marcadas.size} ${marcadas.size === 1 ? 'unidade' : 'unidades'}`}
          </button>
        </>
      )}
    </section>
  );
}

export default ImportarPlanilha;
