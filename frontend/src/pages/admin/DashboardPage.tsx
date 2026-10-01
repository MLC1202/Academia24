// Editor da grade de aulas (/admin/dashboard).
// Escolho unidade + dia, mexo nas aulas e salvo. So abre logado (o App
// envolve esta pagina no RotaAdmin). Le a grade do banco e salva no
// banco: o que for salvo aparece no site na hora (a versao anterior fica
// guardada).

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ErroApi, sair, SEM_API } from "../../lib/api";
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
  | { status: "pronto"; grades: Grades };

function DashboardPage({ email }: { email: string | null }) {
  const navigate = useNavigate();
  const [carga, setCarga] = useState<Carga>({ status: "carregando" });
  const [unidade, setUnidade] = useState<UnidadeSlug>("alphaville");
  const [dia, setDia] = useState<Dia>("seg");
  const [grade, setGrade] = useState<GradeUnidade>(gradeVazia);
  const [estado, setEstado] = useState<Estado>("limpo");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [saindo, setSaindo] = useState(false);

  // Grade atual do banco (sem cache do navegador: aqui quero a mais nova).
  useEffect(() => {
    let ativo = true;
    buscarGrades(true)
      .then(({ grades }) => {
        if (!ativo) return;
        setCarga({ status: "pronto", grades });
        setGrade(grades.alphaville);
      })
      .catch(() => ativo && setCarga({ status: "erro" }));
    return () => {
      ativo = false;
    };
  }, []);

  // Sessao venceu (30 min parado / 8 h): volta pro login.
  function sessaoExpirou() {
    navigate("/admin/login", { replace: true, state: { expirou: true } });
  }

  async function encerrar() {
    if (estado === "alterado" && !confirm("Sair descarta as alterações não salvas. Continuar?")) return;
    setSaindo(true);
    try {
      await sair();
    } catch {
      // Mesmo se a API falhar, a sessao expira sozinha em 30 min.
    }
    navigate("/admin/login", { replace: true });
  }

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
          .map((a) => ({ ...a, modalidade: a.modalidade.trim() }))
          .filter((a) => a.modalidade && a.hora.trim()),
      );
    }
    setSalvando(true);
    setErro("");
    try {
      await salvarGrade(unidade, limpa);
      setGrade(limpa);
      setCarga({ status: "pronto", grades: { ...carga.grades, [unidade]: limpa } });
      setEstado("salvo");
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

  return (
    <div className="admin">
      <header className="admin__topo">
        <div>
          <p className="admin__eyebrow">Área interna</p>
          <h1 className="admin__titulo">Grade de aulas</h1>
        </div>
        <div className="admin__conta">
          {email && <span className="admin__email">{email}</span>}
          <Link to="/" className="admin__voltar">
            ← Ver o site
          </Link>
          {!SEM_API && (
            <button type="button" className="admin__sair" onClick={encerrar} disabled={saindo}>
              {saindo ? "Saindo…" : "Sair"}
            </button>
          )}
        </div>
      </header>

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
            {aulas.map((aula, i) => (
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
                  className="admin__remover"
                  aria-label={`Remover ${aula.modalidade || "aula"}`}
                  onClick={() => remover(i)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="admin__adicionar" onClick={adicionar}>
          + Adicionar aula
        </button>
      </section>

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
    </div>
  );
}

export default DashboardPage;
