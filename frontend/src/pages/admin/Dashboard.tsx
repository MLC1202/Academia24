// Editor da grade de aulas (/admin/dashboard).
// Escolho unidade + dia, mexo nas aulas e salvo. Enquanto nao tiver backend,
// o salvar so grava no localStorage deste navegador.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { slugsUnidades, unidades, type UnidadeSlug } from "../../unidades";
import {
  dias,
  novaAula,
  ordenarPorHora,
  type Aula,
  type Dia,
  type GradeUnidade,
} from "../../grade";
import { carregarGrades, salvarGrade } from "../../lib/grade-store";
import "./Dashboard.css";

type Estado = "limpo" | "alterado" | "salvo";

function Dashboard() {
  const iniciais = useMemo(() => carregarGrades(), []);

  const [unidade, setUnidade] = useState<UnidadeSlug>("alphaville");
  const [dia, setDia] = useState<Dia>("seg");
  const [grade, setGrade] = useState<GradeUnidade>(iniciais.alphaville);
  const [estado, setEstado] = useState<Estado>("limpo");

  function trocarUnidade(slug: UnidadeSlug) {
    if (estado === "alterado" && !confirm("Trocar de unidade descarta as alterações não salvas. Continuar?")) return;
    setUnidade(slug);
    setGrade(carregarGrades()[slug]);
    setEstado("limpo");
  }

  function mexer(indice: number, campo: keyof Aula, valor: string) {
    setGrade((g) => ({
      ...g,
      [dia]: g[dia].map((a, i) => (i === indice ? { ...a, [campo]: valor } : a)),
    }));
    setEstado("alterado");
  }

  function adicionar() {
    setGrade((g) => ({ ...g, [dia]: [...g[dia], novaAula()] }));
    setEstado("alterado");
  }

  function remover(indice: number) {
    setGrade((g) => ({ ...g, [dia]: g[dia].filter((_, i) => i !== indice) }));
    setEstado("alterado");
  }

  function ordenar() {
    setGrade((g) => ({ ...g, [dia]: ordenarPorHora(g[dia]) }));
    setEstado("alterado");
  }

  function salvar() {
    // Linha sem horario ou sem modalidade eu descarto na hora de salvar.
    const limpa: GradeUnidade = { ...grade };
    for (const d of dias) {
      limpa[d.chave] = ordenarPorHora(
        grade[d.chave].filter((a) => a.modalidade.trim() && a.hora.trim()),
      );
    }
    salvarGrade(unidade, limpa);
    setGrade(limpa);
    setEstado("salvo");
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
        <Link to="/" className="admin__voltar">
          ← Ver o site
        </Link>
      </header>

      <p className="admin__aviso">
        Enquanto o backend não existir, o que você salvar fica guardado
        <strong> apenas neste navegador</strong> — serve para testar, mas não
        aparece para os visitantes.
      </p>

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

      <div className="admin__rodape">
        <div className="admin__rodape-inner">
        <div className="admin__estado">
          {estado === "alterado" && (
            <span className="admin__estado-alterado">
              Alterações não salvas
              {incompletas > 0 &&
                ` · ${incompletas} linha(s) em branco serão descartadas`}
            </span>
          )}
          {estado === "salvo" && (
            <span className="admin__estado-salvo">
              Grade da unidade {unidades[unidade].nome} salva.
            </span>
          )}
        </div>

        <button
          type="button"
          className="admin__salvar"
          disabled={estado !== "alterado"}
          onClick={salvar}
        >
          Salvar grade
        </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
