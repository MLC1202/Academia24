// Formulario "Agende sua aula", usado na pagina /agendamento.
//
// Se o link vier com ?unidade=<slug> (botao da subpagina da unidade), a
// unidade ja abre marcada.
//
// Visual no estilo Apple (skill apple-design), igual a grade de aulas:
// fundo claro, uma cor de destaque (o vermelho), letra grande e espaco.
// Em vez de um monte de selects, o formulario vira perguntas em sequencia,
// como na loja da Apple:
//   1. Qual unidade?          -> 4 cards com foto (escolhe clicando)
//   2. Quando prefere treinar? -> segmented control Manha/Tarde/Noite
//   3. O que voce busca?       -> pilulas
//   4. Seus dados              -> campos agrupados num card so (estilo iPhone)
// No computador o texto de abertura fica preso a esquerda enquanto o
// formulario rola a direita. O botao so libera com tudo certo e, enquanto
// nao libera, diz o que ainda falta.
//
// ATENCAO: por enquanto isso e so a tela. O botao valida os campos e mostra a
// confirmacao, mas NAO manda os dados pra lugar nenhum — so joga no console.
// Quando o endpoint existir, e so trocar o corpo do submeter().

import { useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  unidades,
  slugsUnidades,
  ehSlugUnidade,
  type UnidadeSlug,
} from "../../data/unidades";
import "./FormAgendamento.css";

const inicial = {
  nome: "",
  whatsapp: "",
  email: "",
  unidade: "",
  objetivo: "",
  periodo: "",
};

type Campo = keyof typeof inicial;

const objetivos = [
  { valor: "saude", texto: "Saúde e qualidade de vida" },
  { valor: "emagrecimento", texto: "Emagrecimento" },
  { valor: "massamuscular", texto: "Ganho de massa muscular" },
  { valor: "condicionamento", texto: "Condicionamento físico" },
  { valor: "retomar", texto: "Retomar a rotina de treinos" },
];

const periodos = [
  { valor: "manha", texto: "Manhã", horas: "6h às 12h" },
  { valor: "tarde", texto: "Tarde", horas: "12h às 18h" },
  { valor: "noite", texto: "Noite", horas: "18h às 23h" },
];

// Nome de cada campo na frase "Falta: ..." embaixo do botao.
const nomesCampos: Record<Campo, string> = {
  unidade: "unidade",
  periodo: "período",
  objetivo: "objetivo",
  nome: "nome",
  whatsapp: "telefone",
  email: "e-mail",
};
const ordemCampos: Campo[] = ["unidade", "periodo", "objetivo", "nome", "whatsapp", "email"];

// Vai formatando o telefone enquanto a pessoa digita: (11) 90000-0000.
function mascararWhatsapp(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Uma funcao so pra todos os campos — devolve "" quando esta ok.
function validar(campo: Campo, valor: string) {
  const v = valor.trim();

  if (campo === "nome") {
    if (v.length < 3) return "Digite seu nome.";
    if (v.split(/\s+/).length < 2) return "Digite nome e sobrenome.";
    return "";
  }

  if (campo === "whatsapp") {
    const d = v.replace(/\D/g, "");
    if (d.length < 10) return "Número incompleto.";
    if (d.length === 11 && d[2] !== "9") return "Celular deve começar com 9.";
    return "";
  }

  if (campo === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return "E-mail inválido.";
    return "";
  }

  return v === "" ? "Selecione uma opção." : "";
}

// "a, b e c"
function juntar(itens: string[]) {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

type Estado = "parado" | "enviando" | "enviado";

function FormAgendamento() {
  const [params] = useSearchParams();
  const [dados, setDados] = useState(() => {
    const unidade = params.get("unidade") ?? "";
    return ehSlugUnidade(unidade) ? { ...inicial, unidade } : inicial;
  });
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [consentimento, setConsentimento] = useState(false);
  const [estado, setEstado] = useState<Estado>("parado");

  const escolher = (campo: Campo, valor: string) => {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((x) => ({ ...x, [campo]: "" }));
  };

  const preencher = (campo: Campo) => (e: ChangeEvent<HTMLInputElement>) =>
    escolher(
      campo,
      campo === "whatsapp" ? mascararWhatsapp(e.target.value) : e.target.value,
    );

  const conferir = (campo: Campo) => () => {
    if (dados[campo] === "") return; // campo vazio nao ganha erro so por sair
    setErros((x) => ({ ...x, [campo]: validar(campo, dados[campo]) }));
  };

  const faltando = ordemCampos.filter((c) => validar(c, dados[c]) !== "");
  const completo = consentimento && faltando.length === 0;

  function submeter(e: FormEvent) {
    e.preventDefault();
    if (!completo || estado === "enviando") return;

    setEstado("enviando");

    // Aqui e o lugar do POST quando o backend existir. Por enquanto so mostro
    // no console pra conferir que os dados estao chegando certos.
    console.info("[agendamento]", {
      ...dados,
      nome: dados.nome.trim(),
      email: dados.email.trim(),
      origem: window.location.pathname,
      criadoEm: new Date().toISOString(),
    });

    setEstado("enviado");
  }

  // ---------- Tela de confirmacao ----------
  if (estado === "enviado") {
    const info = unidades[dados.unidade as UnidadeSlug];
    const periodo = periodos.find((p) => p.valor === dados.periodo)!;
    const objetivo = objetivos.find((o) => o.valor === dados.objetivo)!;

    return (
      <section className="agendar agendar--fim snap-section" id="agendar">
        <div className="agendar__fim">
          <svg className="agendar__fim-icone" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" />
            <path d="M15 27l7 7 15-16" />
          </svg>

          <h2 className="agendar__fim-titulo">
            Tudo certo, {dados.nome.trim().split(" ")[0]}.
          </h2>
          <p className="agendar__fim-texto">
            A equipe da unidade {info.nome} vai entrar em contato pelo telefone{" "}
            {dados.whatsapp} para combinar o dia da sua aula.
          </p>

          <dl className="agendar__resumo">
            <div>
              <dt>Unidade</dt>
              <dd>
                {info.marca} · {info.nome}
              </dd>
            </div>
            <div>
              <dt>Período</dt>
              <dd>{periodo.texto}</dd>
            </div>
            <div>
              <dt>Objetivo</dt>
              <dd>{objetivo.texto}</dd>
            </div>
          </dl>

          <Link to="/" className="agendar__link">
            Voltar para o início <span aria-hidden="true">›</span>
          </Link>
        </div>
      </section>
    );
  }

  const idxPeriodo = periodos.findIndex((p) => p.valor === dados.periodo);

  // ---------- Formulario ----------
  return (
    <section className="agendar snap-section" id="agendar">
      <div className="agendar__inner">
        {/* Coluna da esquerda: fica presa na tela no computador */}
        <div className="agendar__intro">
          <p className="agendar__eyebrow">Aula experimental</p>

          <h2 className="agendar__title">
            A sua próxima <span className="agendar__title-destaque">sessão.</span>
          </h2>

          <p className="agendar__subtitle">
            Uma aula para sentir o ritmo da Rede 24, conhecer a nossa forma de
            treinar e descobrir o que combina com você.
          </p>

          <ul className="agendar__beneficios">
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              <div>
                <strong>Sem compromisso</strong>
                <span>Você experimenta no seu tempo.</span>
              </div>
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20V9l8-5 8 5v11M9 20v-6h6v6" />
              </svg>
              <div>
                <strong>Visita guiada</strong>
                <span>Você conhece cada ambiente antes de treinar.</span>
              </div>
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c.8-3.6 3.6-6 7-6s6.2 2.4 7 6" />
              </svg>
              <div>
                <strong>Atendimento da unidade</strong>
                <span>Quem te recebe é a equipe da sua unidade.</span>
              </div>
            </li>
          </ul>
        </div>

        <form className="agendar__form" onSubmit={submeter} noValidate>
          {/* 1. Unidade */}
          <fieldset className="agendar__passo">
            <legend className="agendar__pergunta">
              <span className="agendar__numero">1</span>
              Qual unidade?
            </legend>

            <div className="agendar__unidades">
              {slugsUnidades.map((slug) => {
                const info = unidades[slug];
                return (
                  <label className="agendar__unidade" key={slug}>
                    <input
                      type="radio"
                      name="unidade"
                      value={slug}
                      checked={dados.unidade === slug}
                      onChange={() => escolher("unidade", slug)}
                    />
                    <span
                      className="agendar__unidade-foto"
                      style={{ backgroundImage: `url(${info.foto})` }}
                      aria-hidden="true"
                    />
                    <span className="agendar__unidade-texto">
                      <span className="agendar__unidade-marca">{info.marca}</span>
                      <span className="agendar__unidade-nome">{info.nome}</span>
                      <span className="agendar__unidade-local">{info.local}</span>
                    </span>
                    <span className="agendar__marca-check" aria-hidden="true" />
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* 2. Periodo */}
          <fieldset className="agendar__passo">
            <legend className="agendar__pergunta">
              <span className="agendar__numero">2</span>
              Quando prefere treinar?
            </legend>

            <div
              className={
                idxPeriodo >= 0
                  ? "agendar__periodos agendar__periodos--escolhido"
                  : "agendar__periodos"
              }
              style={{ "--idx": Math.max(idxPeriodo, 0) } as CSSProperties}
            >
              <span className="agendar__periodos-pilula" aria-hidden="true" />
              {periodos.map((p) => (
                <label className="agendar__periodo" key={p.valor}>
                  <input
                    type="radio"
                    name="periodo"
                    value={p.valor}
                    checked={dados.periodo === p.valor}
                    onChange={() => escolher("periodo", p.valor)}
                  />
                  <span className="agendar__periodo-nome">{p.texto}</span>
                  <span className="agendar__periodo-horas">{p.horas}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* 3. Objetivo */}
          <fieldset className="agendar__passo">
            <legend className="agendar__pergunta">
              <span className="agendar__numero">3</span>
              O que você busca?
            </legend>

            <div className="agendar__objetivos">
              {objetivos.map((o) => (
                <label className="agendar__objetivo" key={o.valor}>
                  <input
                    type="radio"
                    name="objetivo"
                    value={o.valor}
                    checked={dados.objetivo === o.valor}
                    onChange={() => escolher("objetivo", o.valor)}
                  />
                  <span>{o.texto}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* 4. Dados */}
          <fieldset className="agendar__passo">
            <legend className="agendar__pergunta">
              <span className="agendar__numero">4</span>
              Seus dados
            </legend>

            <div className="agendar__grupo">
              <div className={erros.nome ? "agendar__campo agendar__campo--erro" : "agendar__campo"}>
                <label htmlFor="nome">Nome completo</label>
                <input
                  id="nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Como podemos chamar você?"
                  value={dados.nome}
                  onChange={preencher("nome")}
                  onBlur={conferir("nome")}
                  aria-invalid={!!erros.nome}
                  aria-describedby={erros.nome ? "erro-nome" : undefined}
                />
                {erros.nome && (
                  <span className="agendar__erro" id="erro-nome">
                    {erros.nome}
                  </span>
                )}
              </div>

              <div className={erros.whatsapp ? "agendar__campo agendar__campo--erro" : "agendar__campo"}>
                <label htmlFor="whatsapp">Telefone</label>
                <input
                  id="whatsapp"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="(11) 90000-0000"
                  value={dados.whatsapp}
                  onChange={preencher("whatsapp")}
                  onBlur={conferir("whatsapp")}
                  aria-invalid={!!erros.whatsapp}
                  aria-describedby={erros.whatsapp ? "erro-whatsapp" : undefined}
                />
                {erros.whatsapp && (
                  <span className="agendar__erro" id="erro-whatsapp">
                    {erros.whatsapp}
                  </span>
                )}
              </div>

              <div className={erros.email ? "agendar__campo agendar__campo--erro" : "agendar__campo"}>
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={dados.email}
                  onChange={preencher("email")}
                  onBlur={conferir("email")}
                  aria-invalid={!!erros.email}
                  aria-describedby={erros.email ? "erro-email" : undefined}
                />
                {erros.email && (
                  <span className="agendar__erro" id="erro-email">
                    {erros.email}
                  </span>
                )}
              </div>
            </div>

            <label className="agendar__consent">
              <input
                type="checkbox"
                checked={consentimento}
                onChange={(e) => setConsentimento(e.target.checked)}
              />
              <span className="agendar__consent-caixa" aria-hidden="true" />
              <span>
                Autorizo o contato da equipe da Rede 24 sobre minha aula
                experimental e condições de matrícula.
              </span>
            </label>
          </fieldset>

          <div className="agendar__enviar">
            <button
              type="submit"
              className="agendar__submit"
              disabled={!completo || estado === "enviando"}
            >
              {estado === "enviando" ? "Enviando…" : "Agendar aula experimental"}
            </button>

            {/* Enquanto o botao esta travado, explica o porque */}
            <p className="agendar__status" aria-live="polite">
              {faltando.length > 0
                ? `Falta: ${juntar(faltando.map((c) => nomesCampos[c]))}.`
                : !consentimento
                  ? "Falta marcar a autorização de contato."
                  : "Leva só 2 minutos. Seus dados ficam seguros com a gente."}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

export default FormAgendamento;
