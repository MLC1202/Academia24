// Aba "Grade de aulas" do dashboard (/admin/dashboard?aba=grade).
// Escolho unidade + dia, mexo nas aulas e salvo. Le a grade do banco e
// salva no banco: o que for salvo aparece no site na hora (a versao
// anterior fica guardada).
//
// O topo (e-mail, sair) fica no DashboardPage. Este painel avisa o
// DashboardPage quando tem alteracao nao salva (aoAlterar), pra ele
// perguntar antes de trocar de aba ou sair.

import { useEffect, useMemo, useState } from "react";
import { ErroApi, SEM_API } from "../../lib/api";
import { slugsUnidades, unidades, type UnidadeSlug } from "../../data/unidades";
import {
  dias,
  gradeVazia,
  novaAula,
  ordenarPorHora,
  type Aula,
  type Dia,
  type GradeUnidade,
  type Grades,
} from "../../data/grade";
import { buscarGrades, salvarGrade } from "../../lib/grade-store";
import ImportarPlanilha from "./ImportarPlanilha";
import VersoesUnidade from "./VersoesUnidade";
import CancelarAulas from "./CancelarAulas";
import DetalhesAula from "./DetalhesAula";
import {
  camposTexto,
  limparDetalhes,
  problemaDetalhes,
  resumoDetalhes,
  type CampoDetalhe,
  type CampoTexto,
} from "../../lib/detalhes-aula";
import "./DashboardPage.css";

type Estado = "limpo" | "alterado" | "salvo";

// Frase pra dona a partir do erro da API. Quando o servidor recusa um dado
// ("Terça, aula 3: horário inválido"), mostro exatamente o que ele disse.
function mensagemDeErro(err: unknown): string {
  if (err instanceof ErroApi) {
    if (err.detalhe) return err.detalhe;
    if (err.codigo === "muitas_tentativas") return "Muitos salvamentos seguidos. Espere alguns minutos.";
    if (err.codigo === "sem_conexao") return "Sem conexão com o servidor. Nada foi salvo; tente de novo.";
  }
  return "Não foi possível salvar. Nada foi alterado no site; tente de novo.";
}

type Carga =
  | { status: "carregando" }
  | { status: "erro" }
  // versoes: qual versao estava no ar quando a grade foi carregada (vai
  // junto no salvar: se outra aba mudou no meio, o servidor recusa).
  | { status: "pronto"; grades: Grades; versoes: Versoes };

type Versoes = Partial<Record<UnidadeSlug, number | null>>;

type Props = {
  aoAlterar: (alterado: boolean) => void;
  aoExpirar: () => void;
};

function PainelGrade({ aoAlterar, aoExpirar }: Props) {
  const [carga, setCarga] = useState<Carga>({ status: "carregando" });
  const [unidade, setUnidade] = useState<UnidadeSlug>("alphaville");
  const [dia, setDia] = useState<Dia>("seg");
  const [grade, setGrade] = useState<GradeUnidade>(gradeVazia);
  const [estado, setEstado] = useState<Estado>("limpo");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  // Muda sempre que a grade no banco muda -> o historico recarrega.
  const [versaoChave, setVersaoChave] = useState(0);
  // Aulas com o painel "Detalhes" aberto (pelo id da aula).
  const [abertos, setAbertos] = useState<Set<string>>(() => new Set());

  // Grade atual do banco (sem cache do navegador: aqui quero a mais nova).
  useEffect(() => {
    let ativo = true;
    buscarGrades(true)
      .then(({ grades, versoes = {} }) => {
        if (!ativo) return;
        setCarga({ status: "pronto", grades, versoes });
        setGrade(grades.alphaville);
      })
      .catch(() => ativo && setCarga({ status: "erro" }));
    return () => {
      ativo = false;
    };
  }, []);

  // Depois de importar a planilha: busca de novo e mostra a unidade aberta.
  async function recarregar() {
    try {
      const { grades, versoes = {} } = await buscarGrades(true);
      setCarga({ status: "pronto", grades, versoes });
      setGrade(grades[unidade]);
      setEstado("limpo");
      setErro("");
      setVersaoChave((n) => n + 1);
    } catch {
      setCarga({ status: "erro" });
    }
  }

  // Conta pro DashboardPage se tem alteracao nao salva. Ao fechar o painel
  // (trocou de aba, voltou no navegador), zera o aviso.
  useEffect(() => {
    aoAlterar(estado === "alterado");
  }, [estado, aoAlterar]);
  useEffect(() => () => aoAlterar(false), [aoAlterar]);

  // F5, fechar a aba ou digitar outro endereco com edicao nao salva: o
  // navegador pergunta antes de sair (o texto do aviso e dele, nao da pra
  // trocar).
  useEffect(() => {
    if (estado !== "alterado") return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [estado]);

  // Sessao venceu (30 min parado / 8 h): o DashboardPage manda pro login.
  const sessaoExpirou = aoExpirar;

  function trocarUnidade(slug: UnidadeSlug) {
    if (carga.status !== "pronto") return;
    if (estado === "alterado" && !confirm("Trocar de unidade descarta as alterações não salvas. Continuar?")) return;
    setUnidade(slug);
    setGrade(carga.grades[slug]);
    setEstado("limpo");
    setErro("");
  }

  function mexer(indice: number, campo: keyof Aula, valor: string) {
    setGrade((g) => ({
      ...g,
      [dia]: g[dia].map((a, i) => (i === indice ? { ...a, [campo]: valor } : a)),
    }));
    setEstado("alterado");
    setErro("");
  }

  // Duracao vira numero (vazio = sem duracao). Texto fica como digitado; o
  // limpar (espacos) acontece ao salvar.
  function mexerDetalhe(indice: number, campo: CampoDetalhe, valor: string) {
    setGrade((g) => ({
      ...g,
      [dia]: g[dia].map((a, i) => {
        if (i !== indice) return a;
        if (campo === "duracao") {
          return { ...a, duracao: valor === "" ? undefined : Number(valor) };
        }
        return { ...a, [campo]: valor };
      }),
    }));
    setEstado("alterado");
    setErro("");
  }

  function alternarDetalhes(id: string) {
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  // Sugestoes: o que ja existe em QUALQUER dia da grade desta unidade.
  const sugestoes = useMemo(() => {
    const todas = dias.flatMap((d) => grade[d.chave]);
    const lista = (campo: CampoTexto) =>
      [...new Set(todas.map((a) => (a[campo] ?? "").trim()).filter(Boolean))].sort((x, y) =>
        x.localeCompare(y, "pt-BR"),
      );
    return { professor: lista("professor"), estudio: lista("estudio"), categoria: lista("categoria") };
  }, [grade]);

  function adicionar() {
    setGrade((g) => ({ ...g, [dia]: [...g[dia], novaAula()] }));
    setEstado("alterado");
    setErro("");
  }

  function remover(indice: number) {
    setGrade((g) => ({ ...g, [dia]: g[dia].filter((_, i) => i !== indice) }));
    setEstado("alterado");
    setErro("");
  }

  function ordenar() {
    setGrade((g) => ({ ...g, [dia]: ordenarPorHora(g[dia]) }));
    setEstado("alterado");
    setErro("");
  }

  async function salvar() {
    if (SEM_API || salvando || carga.status !== "pronto") return;
    // Linha sem horario ou sem modalidade eu descarto na hora de salvar.
    const limpa: GradeUnidade = { ...grade };
    for (const d of dias) {
      limpa[d.chave] = ordenarPorHora(
        grade[d.chave]
          .map((a) => limparDetalhes({ ...a, modalidade: a.modalidade.trim() }))
          .filter((a) => a.modalidade && a.hora.trim()),
      );
    }
    // Detalhe invalido: nem manda. Mostra onde esta e abre o painel dela.
    for (const d of dias) {
      const i = limpa[d.chave].findIndex((a) => problemaDetalhes(a));
      if (i >= 0) {
        const aula = limpa[d.chave][i];
        setDia(d.chave);
        setAbertos((atual) => new Set(atual).add(aula.id));
        setErro(`${d.longo}, ${aula.hora} ${aula.modalidade} — ${problemaDetalhes(aula)}`);
        return;
      }
    }
    setSalvando(true);
    setErro("");
    try {
      // Sem a versao (resposta antiga, de antes desta conferencia existir):
      // salva sem conferir em vez de travar com um 409 falso.
      const base = unidade in carga.versoes ? carga.versoes[unidade] : undefined;
      const versao = await salvarGrade(unidade, limpa, "edicao", base);
      setGrade(limpa);
      setCarga({
        status: "pronto",
        grades: { ...carga.grades, [unidade]: limpa },
        versoes: { ...carga.versoes, [unidade]: versao },
      });
      setEstado("salvo");
      setVersaoChave((n) => n + 1);
    } catch (err) {
      if (err instanceof ErroApi && err.codigo === "nao_autenticado") return sessaoExpirou();
      setErro(mensagemDeErro(err));
    } finally {
      setSalvando(false);
    }
  }

  // Aulas do dia que esta aberto + quantas estao pela metade.
  const aulas = grade[dia];
  const incompletas = aulas.filter(
    (a) => !a.modalidade.trim() || !a.hora.trim(),
  ).length;

  // Fragmento: os blocos ficam direto dentro do .admin do DashboardPage
  // (o CSS centraliza os filhos diretos).
  return (
    <>
      <p className="admin__aviso">
        {SEM_API ? (
          <>Prévia: aqui dá para mexer, mas <strong>não é possível salvar</strong>.</>
        ) : (
          <>Ao salvar, a grade da unidade <strong>vai para o site na hora</strong>.
          A versão anterior fica guardada.</>
        )}
      </p>

      {carga.status === "carregando" && <p className="admin__vazio">Carregando a grade…</p>}
      {carga.status === "erro" && (
        <p className="admin__vazio" role="alert">
          Não foi possível carregar a grade. Recarregue a página.
        </p>
      )}
      {carga.status === "pronto" && (<>
      <ImportarPlanilha
        desativado={SEM_API}
        antesDePublicar={() =>
          estado !== "alterado" ||
          confirm("Você tem alterações não salvas no editor abaixo. Publicar a planilha descarta essas alterações. Continuar?")
        }
        aoPublicar={recarregar}
        aoExpirar={sessaoExpirou}
      />

      <section className="admin__bloco">
        <h2 className="admin__bloco-titulo">Unidade</h2>
        <div className="admin__abas">
          {slugsUnidades.map((slug) => (
            <button
              key={slug}
              type="button"
              className={
                slug === unidade ? "admin__aba admin__aba--ativa" : "admin__aba"
              }
              onClick={() => trocarUnidade(slug)}
            >
              {unidades[slug].nome}
            </button>
          ))}
        </div>
        <VersoesUnidade
          key={unidade}
          unidade={unidade}
          chave={versaoChave}
          desativado={SEM_API}
          temAlteracao={estado === "alterado"}
          aoMudar={recarregar}
          aoExpirar={sessaoExpirou}
        />
      </section>

      <section className="admin__bloco">
        <h2 className="admin__bloco-titulo">Dia da semana</h2>
        <div className="admin__abas">
          {dias.map((d) => (
            <button
              key={d.chave}
              type="button"
              className={
                d.chave === dia ? "admin__aba admin__aba--ativa" : "admin__aba"
              }
              onClick={() => setDia(d.chave)}
            >
              <span className="admin__aba-dia">{d.longo}</span>
              <span className="admin__aba-contador">
                {grade[d.chave].length === 1
                  ? '1 aula'
                  : `${grade[d.chave].length} aulas`}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="admin__bloco">
        <div className="admin__bloco-head">
          <h2 className="admin__bloco-titulo">
            {dias.find((d) => d.chave === dia)!.longo} ·{" "}
            {unidades[unidade].nome}
          </h2>
          <button type="button" className="admin__link" onClick={ordenar}>
            Ordenar por horário
          </button>
        </div>

        {aulas.length === 0 ? (
          <p className="admin__vazio">
            Nenhuma aula neste dia. Use o botão abaixo para adicionar.
          </p>
        ) : (
          <ul className="admin__lista">
            {aulas.map((aula, i) => {
              const aberto = abertos.has(aula.id);
              const resumo = resumoDetalhes(aula);
              const comProblema = !!problemaDetalhes(aula);
              const idPainel = `detalhes-${aula.id}`;
              return (
              <li className="admin__linha" key={aula.id}>
                <input
                  className="admin__hora"
                  type="time"
                  value={aula.hora}
                  aria-label="Horário"
                  onChange={(e) => mexer(i, "hora", e.target.value)}
                />
                <input
                  className="admin__modalidade"
                  type="text"
                  placeholder="Modalidade (ex.: Spinning)"
                  maxLength={60}
                  value={aula.modalidade}
                  aria-label="Modalidade"
                  onChange={(e) => mexer(i, "modalidade", e.target.value)}
                />
                <button
                  type="button"
                  className={
                    "admin__detalhes" +
                    (aberto ? " admin__detalhes--aberto" : "") +
                    (comProblema ? " admin__detalhes--erro" : "")
                  }
                  aria-expanded={aberto}
                  aria-controls={idPainel}
                  title={resumo || "Duração, professor, estúdio e categoria"}
                  onClick={() => alternarDetalhes(aula.id)}
                >
                  <span className="admin__detalhes-texto">{resumo || "+ Detalhes"}</span>
                  <span aria-hidden="true">{aberto ? "▴" : "▾"}</span>
                </button>
                <button
                  type="button"
                  className="admin__remover"
                  aria-label={`Remover ${aula.modalidade || "aula"}`}
                  onClick={() => remover(i)}
                >
                  Remover
                </button>
                {aberto && (
                  <DetalhesAula
                    aula={aula}
                    idPainel={idPainel}
                    aoMudar={(campo, valor) => mexerDetalhe(i, campo, valor)}
                  />
                )}
              </li>
              );
            })}
          </ul>
        )}

        <button type="button" className="admin__adicionar" onClick={adicionar}>
          + Adicionar aula
        </button>

        {/* Sugestoes dos campos de detalhe (o que ja existe na unidade). */}
        {(Object.keys(camposTexto) as CampoTexto[]).map((campo) => (
          <datalist id={`sugestoes-${campo}`} key={campo}>
            {sugestoes[campo].map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        ))}
      </section>

      {/* Cancelar aula numa data (usa a grade publicada, nao a do editor). */}
      <CancelarAulas
        key={unidade}
        unidade={unidade}
        chave={versaoChave}
        desativado={SEM_API}
        aoExpirar={sessaoExpirou}
      />

      </>)}

      <div className="admin__rodape">
        <div className="admin__rodape-inner">
        <div className="admin__estado">
          {estado === "alterado" && !erro && (
            <span className="admin__estado-alterado">
              Alterações não salvas
              {incompletas > 0 &&
                ` · ${incompletas} linha(s) em branco serão descartadas`}
            </span>
          )}
          {estado === "salvo" && !erro && (
            <span className="admin__estado-salvo">
              Grade da unidade {unidades[unidade].nome} salva e publicada.
            </span>
          )}
          {erro && (
            <span className="admin__estado-erro" role="alert">
              {erro}
            </span>
          )}
        </div>

        <button
          type="button"
          className="admin__salvar"
          disabled={estado !== "alterado" || salvando || SEM_API}
          onClick={salvar}
        >
          {salvando ? "Salvando…" : "Salvar grade"}
        </button>
        </div>
      </div>
    </>
  );
}

export default PainelGrade;
