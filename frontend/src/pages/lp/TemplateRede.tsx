// Layout das LPs de Alphaville, Cambui e Lagoa (as tres usavam o mesmo
// modelo no Lovable). Faixas alternando escuro / claro / vermelho; os textos
// vem de conteudo.ts.

import { Link } from "react-router-dom";
import WhatsApp from "../../components/WhatsApp/WhatsApp";
import { unidades, type UnidadeSlug } from "../../data/unidades";
import { registrarEvento } from "../../lib/analytics";
import { formatarNota, useNotas } from "../../lib/avaliacoes-store";
import type { LpRede } from "./conteudo";
import LinkWhatsApp from "./LinkWhatsApp";
import "./TemplateRede.css";

function Kicker({ texto, marca }: { texto: string; marca?: "linha" | "ponto" }) {
  return (
    <p className="lpr-kicker">
      {marca && <span className={`lpr-kicker__${marca}`} aria-hidden="true" />}
      {texto}
    </p>
  );
}

function Seta() {
  return <span aria-hidden="true">→</span>;
}

function TemplateRede({ lp, slug }: { lp: LpRede; slug: UnidadeSlug }) {
  const { hero, diferenciais, destaque, facilidades, galeria, google, oferta, local } = lp;
  const notas = useNotas();
  // Nota do painel (banco); a de conteudo.ts vale enquanto ela nao chega.
  const notaDoPainel = notas[slug];
  const nota = notaDoPainel !== undefined ? formatarNota(notaDoPainel) : google.nota;

  return (
    <div className="lpr">
      <section className="lpr-hero">
        <img className="lpr-hero__foto" src={hero.foto.src} alt={hero.foto.alt} fetchPriority="high" />
        <div className="lpr-container lpr-hero__grade">
          <div className="lpr-hero__texto">
            <Kicker texto={hero.kicker} marca="linha" />
            <h1 className="lpr-h1">{hero.titulo}</h1>
            <p className="lpr-hero__lead">{hero.texto}</p>
            <div className="lpr-hero__destaque">
              <strong>{hero.destaque.forte}</strong>
              <span>{hero.destaque.sub}</span>
            </div>
            <div className="lpr-acoes">
              <a
                className="lpr-btn"
                href={unidades[slug].planos}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => registrarEvento("clique_planos", { unidade: slug, origem: "lp" })}
              >
                {hero.cta} <Seta />
              </a>
              <a className="lpr-btn lpr-btn--ghost" href="#estrutura">
                {hero.ctaSecundario}
              </a>
            </div>
            <p className="lpr-nota">{hero.nota}</p>
          </div>
          <dl className="lpr-numeros">
            {hero.numeros.map((n) => (
              <div key={n.valor}>
                <dt>{n.valor}</dt>
                <dd>
                  {n.legenda.map((linha, i) => (
                    <span key={linha}>
                      {i > 0 && <br />}
                      {linha}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="lpr-faixa lpr-faixa--clara" id="estrutura">
        <div className="lpr-container lpr-secao">
          <div className="lpr-intro">
            <Kicker texto={diferenciais.kicker} />
            <h2 className="lpr-h2">{diferenciais.titulo}</h2>
            <p className="lpr-muted">{diferenciais.texto}</p>
          </div>
          <div className="lpr-cards lpr-cards--4">
            {diferenciais.cards.map((c, i) => (
              <article className="lpr-card lpr-card--sobe" key={c.titulo}>
                <span className="lpr-card__n">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="lpr-h3">{c.titulo}</h3>
                <p className="lpr-muted lpr-pequeno">{c.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lpr-faixa lpr-faixa--vermelha">
        <div className="lpr-container lpr-secao lpr-duas">
          <img className="lpr-destaque__foto" src={destaque.foto.src} alt={destaque.foto.alt} loading="lazy" />
          <div>
            <Kicker texto={destaque.kicker} />
            <h2 className="lpr-h2">{destaque.titulo}</h2>
            <p className="lpr-muted">{destaque.texto}</p>
            <ul className="lpr-lista">
              {destaque.itens.map((item) => (
                <li key={item}>
                  <span className="lpr-lista__ponto" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link className="lpr-btn lpr-btn--espaco" to={`/agendamento?unidade=${slug}`}>
              {destaque.cta} <Seta />
            </Link>
          </div>
        </div>
      </section>

      {facilidades && (
        <section className="lpr-faixa lpr-faixa--clara">
          <div className="lpr-container lpr-secao">
            <div className="lpr-intro">
              <Kicker texto={facilidades.kicker} />
              <h2 className="lpr-h2">{facilidades.titulo}</h2>
              <p className="lpr-muted">{facilidades.texto}</p>
            </div>
            <div className="lpr-cards lpr-cards--3">
              {facilidades.cards.map((c) => (
                <article className="lpr-card" key={c.titulo}>
                  <span className="lpr-card__n lpr-card__n--rotulo">{c.titulo}</span>
                  <p className="lpr-muted lpr-pequeno lpr-card__texto">{c.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="lpr-container lpr-secao">
        <div className="lpr-galeria__topo">
          <div className="lpr-galeria__titulo">
            <Kicker texto={galeria.kicker} />
            <h2 className="lpr-h2">{galeria.titulo}</h2>
          </div>
          <p className="lpr-muted lpr-pequeno lpr-galeria__texto">{galeria.texto}</p>
        </div>
        <div className="lpr-cards lpr-cards--3">
          {galeria.fotos.map((f) => (
            <figure className="lpr-galeria__item" key={f.src}>
              <img src={f.src} alt={f.alt} loading="lazy" />
              <figcaption>{f.alt}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="lpr-faixa lpr-faixa--clara">
        <div className="lpr-container lpr-secao lpr-secao--curta lpr-duas">
          <div>
            <Kicker texto={google.kicker} />
            <h2 className="lpr-h2">{google.titulo}</h2>
          </div>
          <a className="lpr-card lpr-card--sobe lpr-google" href={google.link} target="_blank" rel="noopener noreferrer">
            <p className={nota ? "lpr-google__estrelas" : "lpr-google__estrelas lpr-google__estrelas--grande"}>
              ★★★★★
            </p>
            {nota && <p className="lpr-google__nota">{nota}</p>}
            <p className="lpr-google__rotulo">{google.rotulo}</p>
            <p className="lpr-google__texto">{google.texto}</p>
          </a>
        </div>
      </section>

      <section className="lpr-faixa lpr-faixa--vermelha">
        <div className="lpr-container lpr-secao lpr-duas">
          <div>
            <Kicker texto={oferta.kicker} marca="ponto" />
            <h2 className="lpr-h2">{oferta.titulo}</h2>
            <p className="lpr-muted">{oferta.texto}</p>
          </div>
          <div className="lpr-card lpr-oferta">
            <span className="lpr-kicker">{oferta.card.kicker}</span>
            <h3 className="lpr-h3 lpr-h3--maior">{oferta.card.titulo}</h3>
            {oferta.card.texto && <p className="lpr-muted lpr-pequeno">{oferta.card.texto}</p>}
            <LinkWhatsApp className="lpr-btn lpr-btn--cheio" href={lp.whatsapp}>
              {oferta.card.cta} <Seta />
            </LinkWhatsApp>
            <p className="lpr-nota lpr-nota--centro">{oferta.card.nota}</p>
          </div>
        </div>
      </section>

      <section className="lpr-local">
        <div className="lpr-container lpr-secao lpr-secao--curta lpr-tres">
          <div>
            <Kicker texto={local.kicker} />
            <h2 className="lpr-h2 lpr-h2--menor">{local.titulo}</h2>
            <p className="lpr-muted lpr-pequeno lpr-local__endereco">
              {local.endereco.map((linha) => (
                <span key={linha}>{linha}</span>
              ))}
            </p>
            <a className="lpr-link" href={local.mapa} target="_blank" rel="noopener noreferrer">
              {local.textoMapa} <Seta />
            </a>
          </div>
          <div>
            <h3 className="lpr-h3">Horários</h3>
            <ul className="lpr-horarios">
              {local.horarios.map(([dia, hora]) => (
                <li key={dia}>
                  <span className="lpr-muted">{dia}</span>
                  <b>{hora}</b>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="lpr-h3">Dúvidas frequentes</h3>
            <div className="lpr-faq">
              {local.faq.map(([pergunta, resposta]) => (
                <details key={pergunta}>
                  <summary>{pergunta}</summary>
                  <p className="lpr-muted lpr-pequeno">{resposta}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WhatsApp linkDaUnidade={lp.whatsapp} />
    </div>
  );
}

export default TemplateRede;
