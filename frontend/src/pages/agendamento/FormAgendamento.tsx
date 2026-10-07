// Formulario "Agende sua aula", usado na pagina /agendamento.
//
// Se o link vier com ?unidade=<slug> (botao da subpagina da unidade), a
// unidade ja abre marcada.
//
// Visual no estilo Apple (skill apple-design), igual a grade de aulas:
// fundo claro, uma cor de destaque (o vermelho), letra grande e espaco.
// Em vez de um monte de selects, o formulario vira perguntas em sequencia,
// como na loja da Apple. Antes de tudo vem "Quem vai fazer a aula?": o resto
// fica travado ate a pessoa escolher. Se for menor de 18, quem preenche e o
// responsavel legal (nome, telefone e e-mail sao dele) e entra o primeiro
// nome do menor.
//   1. Qual unidade?          -> 4 cards com foto (escolhe clicando)
//   2. Quando prefere treinar? -> segmented control Manha/Tarde/Noite
//   3. O que voce busca?       -> pilulas
//   4. Seus dados              -> campos agrupados num card so (estilo iPhone)
// No computador o texto de abertura fica preso a esquerda enquanto o
// formulario rola a direita. O botao so libera com tudo certo.
//
// Envio: POST /api/lead.php (backend/public/api/lead.php). A validacao
// daqui e so conforto -- quem decide e o servidor. Seguranca:
//  - token CSRF (pego na sessao) e honeypot "referencia" (campo escondido
//    que pessoa nao ve; robo preenche e o servidor descarta);
//  - ao abrir o formulario, a sessao marca a hora: envio rapido demais e
//    recusado ("muito_rapido") e a pessoa so precisa clicar de novo;
//  - nada de dado pessoal no console, localStorage ou URL.

import { useEffect, useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErroApi, SEM_API, abrirFormularioLead, enviarLead } from "../../lib/api";
import {
  unidades,
  slugsUnidades,
  ehSlugUnidade,
  type UnidadeSlug,
} from "../../data/unidades";
import { POLITICA_PRIVACIDADE } from "../../data/site";
import "./FormAgendamento.css";

const inicial = {
  nome: "",
  menor: "",
  whatsapp: "",
  email: "",
  unidade: "",
  objetivo: "",
  periodo: "",
};

type Campo = keyof typeof inicial;
type Quem = "" | "eu" | "dependente";

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

const ordemCampos: Campo[] = ["unidade", "periodo", "objetivo", "nome", "whatsapp", "email"];
const ordemCamposDependente: Campo[] = [...ordemCampos, "menor"];

// Versao dos textos da caixinha de consentimento (LGPD), o de adulto e o de
// responsavel juntos. Mudou algum? Mude a data aqui E em
// backend/src/leads.php (LEAD_CONSENTIMENTO_VERSAO).
const CONSENTIMENTO_VERSAO = "2026-10-07";

// Codigo de erro da API -> frase pra pessoa.
const mensagensErro: Record<string, string> = {
  muito_rapido: "Confira seus dados e toque em enviar de novo.",
  muitas_tentativas:
    "Recebemos vários envios seguidos. Tente de novo mais tarde ou fale com a unidade pelo WhatsApp.",
  consentimento_desatualizado:
    "O texto de autorização foi atualizado. Recarregue a página e envie de novo.",
  dados_invalidos: "Confira os campos destacados.",
  sem_conexao: "Sem conexão. Verifique sua internet e tente de novo.",
};
const erroGenerico = "Não foi possível enviar agora. Tente de novo em instantes.";

// Nome do campo no servidor -> nome do campo nesta tela.
const campoDaApi: Record<string, Campo> = {
  unidade: "unidade",
  periodo: "periodo",
  objetivo: "objetivo",
  nome: "nome",
  menor: "menor",
  telefone: "whatsapp",
  email: "email",
};

// Vai formatando o telefone enquanto a pessoa digita: (11) 90000-0000.
// Numero colado com +55 perde o 55 antes de cortar em 11 digitos (senao o
// "55" virava DDD). Mesma regra do limpar_telefone() do servidor.
function mascararWhatsapp(valor: string) {
  let d = valor.replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
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
    // Mesma regra do servidor (backend/src/leads.php).
    if (!/^\p{L}[\p{L}\p{M}'’ .-]*$/u.test(v)) return "Use só letras no nome.";
    if (v.split(/\s+/).length < 2) return "Digite nome e sobrenome.";
    return "";
  }

  if (campo === "menor") {
    if (v.length < 2) return "Digite o primeiro nome.";
    if (!/^\p{L}[\p{L}\p{M}'’ .-]*$/u.test(v)) return "Use só letras no nome.";
    return "";
  }

  if (campo === "whatsapp") {
    const d = v.replace(/\D/g, "");
    if (d.length < 10) return "Número incompleto.";
    if (d.length === 11 && d[2] !== "9") return "Celular deve começar com 9.";
    if (d[0] === "0" || d[1] === "0") return "DDD inválido.";
    if (d.length === 10 && !/[2-8]/.test(d[2])) return "Número inválido.";
    return "";
  }

  if (campo === "email") {
    // So ASCII, como o FILTER_VALIDATE_EMAIL do servidor (que recusa acento).
    if (!/^[\x21-\x7e]+@[\x21-\x7e]+\.[a-z]{2,}$/i.test(v) || /@.*@/.test(v)) {
      return "E-mail inválido (sem acento ou espaço).";
    }
    // Mesma regra do servidor: comecando com = + - o Excel acharia formula.
    if (/^[=+-]/.test(v)) return "E-mail inválido.";
    return "";
  }

  return v === "" ? "Selecione uma opção." : "";
}

type Estado = "parado" | "enviando" | "enviado";

function FormAgendamento() {
  const [params] = useSearchParams();
  const [dados, setDados] = useState(() => {
    const unidade = params.get("unidade") ?? "";
    return ehSlugUnidade(unidade) ? { ...inicial, unidade } : inicial;
  });
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [quem, setQuem] = useState<Quem>("");
  const [consentimento, setConsentimento] = useState(false);
  const [estado, setEstado] = useState<Estado>("parado");
  const [erroEnvio, setErroEnvio] = useState("");
  const [isca, setIsca] = useState(""); // honeypot

  // Abriu o formulario: avisa o servidor (marca a hora da visita).
  useEffect(() => {
    if (!SEM_API) void abrirFormularioLead();
  }, []);

  const escolher = (campo: Campo, valor: string) => {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((x) => ({ ...x, [campo]: "" }));
  };

  const preencher = (campo: Campo) => (e: ChangeEvent<HTMLInputElement>) =>
    escolher(
      campo,
      campo === "whatsapp" ? mascararWhatsapp(e.target.value) : e.target.value,
    );

  // O texto da autorizacao muda conforme a escolha: trocou, aceita de novo.
  const escolherQuem = (valor: Quem) => {
    setQuem(valor);
    setConsentimento(false);
    setErros((x) => ({ ...x, menor: "" }));
  };

  const conferir = (campo: Campo) => () => {
    if (dados[campo] === "") return; // campo vazio nao ganha erro so por sair
    setErros((x) => ({ ...x, [campo]: validar(campo, dados[campo]) }));
  };

  const ehDependente = quem === "dependente";
  const campos = ehDependente ? ordemCamposDependente : ordemCampos;
  const faltando = campos.filter((c) => validar(c, dados[c]) !== "");
  const completo = quem !== "" && consentimento && faltando.length === 0;

  async function submeter(e: FormEvent) {
    e.preventDefault();
    if (!completo || estado === "enviando") return;

    // Previa no GitHub Pages: nao existe servidor, entao nao finge que enviou.
    if (SEM_API) {
      setErroEnvio("Esta é uma prévia do site: o agendamento ainda não está ativo.");
      return;
    }

    setEstado("enviando");
    setErroEnvio("");

    try {
      await enviarLead({
        unidade: dados.unidade,
        periodo: dados.periodo,
        objetivo: dados.objetivo,
        nome: dados.nome.trim(),
        menor: ehDependente ? dados.menor.trim() : null,
        telefone: dados.whatsapp,
        email: dados.email.trim(),
        consentimento: true,
        consentimento_versao: CONSENTIMENTO_VERSAO,
        referencia: isca,
      });
      setEstado("enviado");
    } catch (erro) {
      const codigo = erro instanceof ErroApi ? erro.codigo : "";
      // Campo recusado pelo servidor: marca o campo, igual a validacao local.
      if (erro instanceof ErroApi && erro.campos) {
        const novos: Partial<Record<Campo, string>> = {};
        for (const nomeApi of Object.keys(erro.campos)) {
          const campo = campoDaApi[nomeApi];
          if (campo) novos[campo] = "Confira este campo.";
        }
        setErros((x) => ({ ...x, ...novos }));
      }
      setErroEnvio(mensagensErro[codigo] ?? erroGenerico);
      setEstado("parado");
    }
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

          <h1 className="agendar__fim-titulo">
            Tudo certo, {dados.nome.trim().split(" ")[0]}.
          </h1>
          <p className="agendar__fim-texto">
            A equipe da unidade {info.nome} vai entrar em contato pelo telefone{" "}
            {dados.whatsapp} para combinar o dia da{" "}
            {ehDependente ? `aula de ${dados.menor.trim()}` : "sua aula"}.
            {ehDependente &&
              " Lembre-se: você precisa estar presente na aula para assinar a autorização."}
          </p>

          <dl className="agendar__resumo">
            {ehDependente && (
              <div>
                <dt>Aula para</dt>
                <dd>{dados.menor.trim()}</dd>
              </div>
            )}
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

          <h1 className="agendar__title">
            A sua próxima <span className="agendar__title-destaque">sessão.</span>
          </h1>

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
          <fieldset className="agendar__passo">
            <legend className="agendar__pergunta agendar__pergunta--quem">Quem vai fazer a aula?</legend>

            <div className="agendar__quem">
              <label className="agendar__quem-opcao">
                <input
                  type="radio"
                  name="quem"
                  value="eu"
                  checked={quem === "eu"}
                  onChange={() => escolherQuem("eu")}
                />
                <span className="agendar__quem-bolinha" aria-hidden="true" />
                <span>Eu mesmo(a), tenho 18 ou mais</span>
              </label>
              <label className="agendar__quem-opcao">
                <input
                  type="radio"
                  name="quem"
                  value="dependente"
                  checked={ehDependente}
                  onChange={() => escolherQuem("dependente")}
                />
                <span className="agendar__quem-bolinha" aria-hidden="true" />
                <span>Meu filho/minha filha ou dependente, menor de 18 anos.</span>
              </label>
            </div>
            {quem === "" && (
              <p className="agendar__quem-dica">Escolha uma opção para continuar.</p>
            )}
          </fieldset>

          {/* fieldset disabled trava tudo de uma vez: clique, Tab e envio. */}
          <fieldset className="agendar__etapas" disabled={quem === ""}>
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
                Qual horário prefere treinar?
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
                {ehDependente ? "Dados do responsável" : "Seus dados"}
              </legend>

              <div className="agendar__grupo">
                <div className={erros.nome ? "agendar__campo agendar__campo--erro" : "agendar__campo"}>
                  <label htmlFor="nome">
                    {ehDependente ? "Nome do responsável" : "Nome completo"}
                  </label>
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

                {ehDependente && (
                  <div className={erros.menor ? "agendar__campo agendar__campo--erro" : "agendar__campo"}>
                    <label htmlFor="menor">Primeiro nome da criança ou adolescente.</label>
                    <input
                      id="menor"
                      type="text"
                      autoComplete="off"
                      placeholder="Só o primeiro nome"
                      value={dados.menor}
                      onChange={preencher("menor")}
                      onBlur={conferir("menor")}
                      aria-invalid={!!erros.menor}
                      aria-describedby={erros.menor ? "erro-menor" : undefined}
                    />
                    {erros.menor && (
                      <span className="agendar__erro" id="erro-menor">
                        {erros.menor}
                      </span>
                    )}
                  </div>
                )}

                <div className={erros.whatsapp ? "agendar__campo agendar__campo--erro" : "agendar__campo"}>
                  <label htmlFor="whatsapp">
                    {ehDependente ? "Telefone do responsável" : "Telefone"}
                  </label>
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
                  <label htmlFor="email">
                    {ehDependente ? "E-mail do responsável" : "E-mail"}
                  </label>
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
                  {ehDependente
                    ? "Sou o responsável legal e autorizo o contato da Rede 24 sobre a aula experimental, conforme a "
                    : "Autorizo o contato da equipe da Rede 24 sobre minha aula experimental e condições de matrícula, conforme a "}
                  <a
                    href={`${import.meta.env.BASE_URL}${POLITICA_PRIVACIDADE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Política de privacidade
                  </a>
                  .
                </span>
              </label>
              {ehDependente && (
                <p className="agendar__nota">
                  O responsável (o mesmo deste formulário) precisa estar presente na
                  aula agendada para assinar a autorização.
                </p>
              )}
            </fieldset>
          </fieldset>

          {/* Honeypot: fora da tela, fora do Tab e escondido do leitor de
              tela. Pessoa nunca preenche; robo que preenche tudo cai aqui. */}
          <div className="agendar__isca" aria-hidden="true">
            <label htmlFor="referencia">Não preencha este campo</label>
            <input
              id="referencia"
              name="referencia"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={isca}
              onChange={(e) => setIsca(e.target.value)}
            />
          </div>

          {erroEnvio && (
            <p className="agendar__erro-envio" role="alert">
              {erroEnvio}
            </p>
          )}

          <div className="agendar__enviar">
            <button
              type="submit"
              className="agendar__submit"
              disabled={!completo || estado === "enviando"}
            >
              {estado === "enviando" ? "Enviando…" : "Agendar aula experimental"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default FormAgendamento;
