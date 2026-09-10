import { useEffect, useRef, useState } from "react";
import { unidades, linkWhatsapp, type UnidadeSlug } from "../unidades";
import { enviarLead, type Interesse, type LeadUnidade } from "../lib/lead";
import "./ContatoUnidade.css";

const opcoes: { valor: Interesse; texto: string; frase: string }[] = [
  {
    valor: "aula",
    texto: "Aula experimental",
    frase: "quero agendar uma aula experimental",
  },
  {
    valor: "planos",
    texto: "Planos e valores",
    frase: "quero conhecer os planos e valores",
  },
];

function mascararWhatsapp(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function validarNome(valor: string) {
  const v = valor.trim();
  if (v.length < 3) return "Digite seu nome.";
  if (v.split(/\s+/).length < 2) return "Digite nome e sobrenome.";
  return "";
}

function validarWhatsapp(valor: string) {
  const d = valor.replace(/\D/g, "");
  if (d.length < 10) return "Número incompleto.";
  if (d.length === 11 && d[2] !== "9") return "Celular deve começar com 9.";
  return "";
}

function montarMensagem(lead: LeadUnidade) {
  const frase = opcoes.find((o) => o.valor === lead.interesse)!.frase;
  return `Olá! Sou ${lead.nome} e ${frase} da unidade ${
    unidades[lead.unidade].nome
  }.`;
}

type Props = {
  unidade: UnidadeSlug;
  /** Vem do botão clicado. null quando o botão é genérico. */
  interesseInicial: Interesse | null;
  onFechar: () => void;
};

function ContatoUnidade({ unidade, interesseInicial, onFechar }: Props) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [interesse, setInteresse] = useState<Interesse | null>(
    interesseInicial,
  );
  const [erros, setErros] = useState<{ nome?: string; whatsapp?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [conversa, setConversa] = useState<string | null>(null);

  const campoNome = useRef<HTMLInputElement>(null);

  // fecha no Esc e foca o primeiro campo ao abrir
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    const frame = requestAnimationFrame(() => campoNome.current?.focus());
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      cancelAnimationFrame(frame);
    };
  }, [onFechar]);

  const completo =
    validarNome(nome) === "" && validarWhatsapp(whatsapp) === "" && !!interesse;

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!completo || enviando) return;

    setEnviando(true);

    const lead: LeadUnidade = {
      tipo: "unidade",
      nome: nome.trim(),
      whatsapp,
      unidade,
      interesse: interesse!,
      origem: window.location.pathname,
      criadoEm: new Date().toISOString(),
    };

    // o lead nunca bloqueia o atendimento: se falhar, segue para o WhatsApp
    try {
      await enviarLead(lead);
    } catch (erro) {
      console.error("[lead] falha ao enviar", erro);
    }

    const link = linkWhatsapp(unidade, montarMensagem(lead));
    setConversa(link);
    if (link) window.open(link, "_blank", "noopener,noreferrer");

    setEnviando(false);
    setEnviado(true);
  }

  const info = unidades[unidade];

  return (
    <div
      className="contato"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contato-titulo"
    >
      <button
        type="button"
        className="contato__fundo"
        aria-label="Fechar"
        onClick={onFechar}
      />

      <div className="contato__caixa">
        <button
          type="button"
          className="contato__fechar"
          aria-label="Fechar"
          onClick={onFechar}
        >
          ×
        </button>

        <p className="contato__unidade">
          {info.marca} · Unidade {info.nome}
        </p>

        {enviado ? (
          <div className="contato__fim">
            <h2 className="contato__titulo" id="contato-titulo">
              Tudo certo, {nome.trim().split(" ")[0]}.
            </h2>
            <p className="contato__texto">
              {conversa
                ? `Abrimos a conversa com a unidade ${info.nome} no WhatsApp. Se a janela não apareceu, use o botão abaixo.`
                : `A equipe da unidade ${info.nome} vai te chamar no WhatsApp que você informou.`}
            </p>
            {conversa ? (
              <a
                className="contato__enviar"
                href={conversa}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir a conversa
              </a>
            ) : (
              <button
                type="button"
                className="contato__enviar"
                onClick={onFechar}
              >
                Fechar
              </button>
            )}
          </div>
        ) : (
          <form className="contato__form" onSubmit={submeter}>
            <h2 className="contato__titulo" id="contato-titulo">
              Falta pouco.
            </h2>
            <p className="contato__texto">
              Deixe seu nome e WhatsApp que a equipe da unidade continua daqui.
            </p>

            <fieldset className="contato__escolha">
              <legend>O que você quer saber?</legend>
              <div className="contato__opcoes">
                {opcoes.map((o) => (
                  <button
                    key={o.valor}
                    type="button"
                    className={
                      interesse === o.valor
                        ? "contato__opcao contato__opcao--ativa"
                        : "contato__opcao"
                    }
                    aria-pressed={interesse === o.valor}
                    onClick={() => setInteresse(o.valor)}
                  >
                    {o.texto}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="contato__campo">
              <label htmlFor="contato-nome">Nome e sobrenome</label>
              <input
                id="contato-nome"
                ref={campoNome}
                type="text"
                placeholder="Como podemos chamar você?"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErros((x) => ({ ...x, nome: "" }));
                }}
                onBlur={() =>
                  setErros((x) => ({ ...x, nome: validarNome(nome) }))
                }
                aria-invalid={!!erros.nome}
              />
              {erros.nome && <span className="contato__erro">{erros.nome}</span>}
            </div>

            <div className="contato__campo">
              <label htmlFor="contato-whatsapp">WhatsApp</label>
              <input
                id="contato-whatsapp"
                type="tel"
                inputMode="numeric"
                placeholder="(11) 90000-0000"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(mascararWhatsapp(e.target.value));
                  setErros((x) => ({ ...x, whatsapp: "" }));
                }}
                onBlur={() =>
                  setErros((x) => ({
                    ...x,
                    whatsapp: validarWhatsapp(whatsapp),
                  }))
                }
                aria-invalid={!!erros.whatsapp}
              />
              {erros.whatsapp && (
                <span className="contato__erro">{erros.whatsapp}</span>
              )}
            </div>

            <button
              type="submit"
              className="contato__enviar"
              disabled={!completo || enviando}
            >
              {enviando ? "Enviando…" : "Continuar no WhatsApp"}
            </button>

            <p className="contato__aviso">
              Ao continuar, você autoriza o contato da equipe da unidade.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ContatoUnidade;
