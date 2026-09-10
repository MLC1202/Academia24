// Secao "Agende sua aula" da home.
//
// ATENCAO: por enquanto isso e so a tela. O botao valida os campos e mostra a
// confirmacao, mas NAO manda os dados pra lugar nenhum — so joga no console.
// Quando o endpoint existir, e so trocar o corpo do submeter().

import { useState } from "react";
import { unidades, slugsUnidades, type UnidadeSlug } from "../unidades";
import "./Agendamento.css";

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
  { valor: "manha", texto: "Manhã" },
  { valor: "tarde", texto: "Tarde" },
  { valor: "noite", texto: "Noite" },
];

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

type Estado = "parado" | "enviando" | "enviado";

function Agendamento() {
  const [dados, setDados] = useState(inicial);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [consentimento, setConsentimento] = useState(false);
  const [estado, setEstado] = useState<Estado>("parado");

  const preencher =
    (campo: Campo) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const valor =
        campo === "whatsapp"
          ? mascararWhatsapp(e.target.value)
          : e.target.value;

      setDados((d) => ({ ...d, [campo]: valor }));
      setErros((x) => ({ ...x, [campo]: "" }));
    };

  const conferir = (campo: Campo) => () =>
    setErros((x) => ({ ...x, [campo]: validar(campo, dados[campo]) }));

  // So libero o botao com tudo preenchido e o consentimento marcado.
  const completo =
    consentimento &&
    (Object.keys(inicial) as Campo[]).every((c) => validar(c, dados[c]) === "");

  function submeter(e: React.FormEvent) {
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

  if (estado === "enviado") {
    const nomeUnidade = unidades[dados.unidade as UnidadeSlug].nome;
    return (
      <div className="agendar__painel agendar__painel--fim">
        <div className="agendar__sucesso">
          <p className="agendar__form-eyebrow">Recebemos seus dados</p>
          <h3 className="agendar__form-title">
            Tudo certo,
            <br />
            {dados.nome.split(" ")[0]}.
          </h3>
          <p className="agendar__sucesso-texto">
            {`A equipe da unidade ${nomeUnidade} vai entrar em contato pelo telefone que você informou.`}
          </p>
        </div>
      </div>
    );
  }

  const formulario = (
    <form className="agendar__form" onSubmit={submeter}>
      <div className="agendar__form-head">
        <p className="agendar__form-eyebrow">Vamos começar</p>
        <p className="agendar__form-passo">
          <span>01 / 02</span>
          <strong>Seus dados</strong>
        </p>
      </div>

      <h3 className="agendar__form-title">
        Conte um pouco
        <br />
        sobre você.
      </h3>

      <div className="agendar__grid">
        <div className="agendar__field">
          <label htmlFor="nome">Nome completo</label>
          <input
            id="nome"
            type="text"
            placeholder="Como podemos chamar você?"
            value={dados.nome}
            onChange={preencher("nome")}
            onBlur={conferir("nome")}
            aria-invalid={!!erros.nome}
          />
          {erros.nome && <span className="agendar__erro">{erros.nome}</span>}
        </div>

        <div className="agendar__field">
          <label htmlFor="whatsapp">Telefone</label>
          <input
            id="whatsapp"
            type="tel"
            inputMode="numeric"
            placeholder="(11) 90000-0000"
            value={dados.whatsapp}
            onChange={preencher("whatsapp")}
            onBlur={conferir("whatsapp")}
            aria-invalid={!!erros.whatsapp}
          />
          {erros.whatsapp && (
            <span className="agendar__erro">{erros.whatsapp}</span>
          )}
        </div>

        <div className="agendar__field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="voce@email.com"
            value={dados.email}
            onChange={preencher("email")}
            onBlur={conferir("email")}
            aria-invalid={!!erros.email}
          />
          {erros.email && <span className="agendar__erro">{erros.email}</span>}
        </div>

        <div className="agendar__field">
          <label htmlFor="unidade">Unidade de interesse</label>
          <select
            id="unidade"
            value={dados.unidade}
            onChange={preencher("unidade")}
          >
            <option value="" disabled>
              Escolha uma unidade
            </option>
            {slugsUnidades.map((slug) => (
              <option key={slug} value={slug}>
                {`${unidades[slug].marca} — ${unidades[slug].nome}`}
              </option>
            ))}
          </select>
        </div>

        <div className="agendar__field">
          <label htmlFor="objetivo">O que você busca?</label>
          <select
            id="objetivo"
            value={dados.objetivo}
            onChange={preencher("objetivo")}
          >
            <option value="" disabled>
              Selecione seu objetivo
            </option>
            {objetivos.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.texto}
              </option>
            ))}
          </select>
        </div>

        <div className="agendar__field">
          <label htmlFor="periodo">Melhor período</label>
          <select
            id="periodo"
            value={dados.periodo}
            onChange={preencher("periodo")}
          >
            <option value="" disabled>
              Quando é melhor para você
            </option>
            {periodos.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.texto}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="agendar__consent">
        <input
          type="checkbox"
          checked={consentimento}
          onChange={(e) => setConsentimento(e.target.checked)}
        />
        <span>
          Autorizo o contato da equipe da Rede 24 sobre minha aula experimental
          e condições de matrícula.
        </span>
      </label>

      <button
        type="submit"
        className="agendar__submit"
        disabled={!completo || estado === "enviando"}
      >
        <span className="agendar__submit-texto">
          <span className="agendar__submit-eyebrow">
            {estado === "enviando" ? "Enviando" : "Quero experimentar"}
          </span>
          <span className="agendar__submit-title">Minha aula</span>
        </span>
        <span className="agendar__submit-seta" aria-hidden="true">
          →
        </span>
      </button>
    </form>
  );

  return (
    <section className="agendar snap-section" id="agendar">
      <div className="agendar__inner">
        <div className="agendar__intro">
          <p className="agendar__eyebrow">Conheça antes de decidir</p>

          <h2 className="agendar__title">
            A sua próxima
            <br />
            <span className="agendar__title-destaque">sessão.</span>
          </h2>

          <p className="agendar__subtitle">
            Uma aula para sentir o ritmo da Rede 24, conhecer a nossa forma de
            treinar e descobrir o que combina com você.
          </p>

          <ul className="agendar__beneficios">
            <li className="agendar__beneficio">
              <h3>Sem compromisso</h3>
              <p>Você experimenta no seu tempo.</p>
            </li>
            <li className="agendar__beneficio">
              <h3>Visita guiada</h3>
              <p>Você conhece cada ambiente antes de treinar.</p>
            </li>
            <li className="agendar__beneficio">
              <h3>Atendimento da unidade</h3>
              <p>Quem te recebe é a equipe da sua unidade.</p>
            </li>
          </ul>
        </div>

        <div className="agendar__painel">
          {formulario}

          <aside className="agendar__aside">
            <div className="agendar__aside-item">
              <svg
                className="agendar__aside-icone"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span className="agendar__aside-label">Leva só</span>
              <strong className="agendar__aside-destaque">2 min</strong>
            </div>

            <div className="agendar__aside-item">
              <svg
                className="agendar__aside-icone"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <h4>Seus dados</h4>
              <p>Ficam seguros com a gente.</p>
            </div>

            <div className="agendar__aside-item">
              <svg
                className="agendar__aside-icone"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M11 4l1.6 4.4L17 10l-4.4 1.6L11 16l-1.6-4.4L5 10l4.4-1.6L11 4z" />
                <path d="M18 4v3M19.5 5.5h-3" />
              </svg>
              <h4>Sem letrinhas</h4>
              <p>Só uma boa primeira experiência.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default Agendamento;
