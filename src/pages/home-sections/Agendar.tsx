import { useState } from "react";
import "./Agendar.css";

const inicial = {
  nome: "",
  whatsapp: "",
  email: "",
  unidade: "",
  objetivo: "",
  periodo: "",
};

type Campo = keyof typeof inicial;

function mascararWhatsapp(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

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

function Agendar() {
  const [dados, setDados] = useState(inicial);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [consentimento, setConsentimento] = useState(false);

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

  const completo =
    consentimento &&
    (Object.keys(inicial) as Campo[]).every((c) => validar(c, dados[c]) === "");

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
          <form className="agendar__form" onSubmit={(e) => e.preventDefault()}>
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
                {erros.nome && (
                  <span className="agendar__erro">{erros.nome}</span>
                )}
              </div>

              <div className="agendar__field">
                <label htmlFor="whatsapp">WhatsApp</label>
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
                {erros.email && (
                  <span className="agendar__erro">{erros.email}</span>
                )}
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
                  <option value="alphaville">24 Wellness — Alphaville</option>
                  <option value="norte">24 Health Club — Norte</option>
                  <option value="cambui">24 Health Club — Cambuí</option>
                  <option value="lagoa">24 Health Club — Lagoa</option>
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
                  <option value="saude">Saúde e qualidade de vida</option>
                  <option value="emagrecimento">Emagrecimento</option>
                  <option value="massamuscular">Ganho de massa muscular</option>
                  <option value="condicionamento">
                    Condicionamento físico
                  </option>
                  <option value="retomar">Retomar a rotina de treinos</option>
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
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
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
                Autorizo o contato da equipe da Rede 24 sobre minha aula
                experimental e condições de matrícula.
              </span>
            </label>

            <button
              type="submit"
              className="agendar__submit"
              disabled={!completo}
            >
              <span className="agendar__submit-texto">
                <span className="agendar__submit-eyebrow">
                  Quero experimentar
                </span>
                <span className="agendar__submit-title">Minha aula</span>
              </span>
              <span className="agendar__submit-seta" aria-hidden="true">
                →
              </span>
            </button>
          </form>

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

export default Agendar;
