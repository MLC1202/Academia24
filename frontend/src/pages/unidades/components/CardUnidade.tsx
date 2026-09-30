// Card de uma unidade: foto de um lado, textos e botoes do outro.
// Usado na lista (/unidades) e sozinho na subpagina (/unidades/<slug>).
// Todos os textos, foto, link da LP e dos planos vem de src/data/unidades.ts.

import { Link } from "react-router-dom";
import { unidades, type UnidadeSlug } from "../../../data/unidades";
import InstagramLink from "../../../components/InstagramLink/InstagramLink";
import "./Unidades.css";

type CardProps = {
  slug: UnidadeSlug;
  invertida?: boolean;
  // Na lista: "Conhecer unidade" abre a LP oficial e a foto/nome levam pra
  // subpagina. Dentro da subpagina: botao de agendar + link da LP.
  detalhe?: boolean;
};

function CardUnidade({ slug, invertida, detalhe }: CardProps) {
  const u = unidades[slug];
  const rotaUnidade = `/unidades/${slug}`;

  const foto = (
    <>
      <span className="unidade__foto-topo">
        <img
          className={`unidade__logo unidade__logo--${u.marca === "24 Wellness" ? "wellness" : "healthclub"}`}
          src={u.logo}
          alt={u.marca}
        />
        <span className="unidade__foto-n">{u.n}</span>
      </span>
      <span className="unidade__foto-local">{u.local}</span>
    </>
  );

  const estiloFoto = {
    // Escuro em cima (logo) e embaixo (local); o meio fica livre pra foto.
    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,.5), rgba(0,0,0,.1) 35%, rgba(0,0,0,.15) 55%, rgba(0,0,0,.75)), url(${u.foto})`,
  };

  return (
    <article className={invertida ? "unidade unidade--invertida" : "unidade"}>
      {detalhe ? (
        <div className="unidade__foto" style={estiloFoto}>
          {foto}
        </div>
      ) : (
        <Link
          to={rotaUnidade}
          className="unidade__foto unidade__foto--link"
          style={estiloFoto}
          aria-label={`Ver unidade ${u.nome}`}
        >
          {foto}
        </Link>
      )}

      <div className="unidade__conteudo">
        {/* Na subpagina marca, nome e textos ja estao no topo da pagina. */}
        {!detalhe && (
          <>
            <p className="unidade__marca">
              {u.marca} · Unidade {u.n}
            </p>

            <div className="unidade__nome-linha">
              <h3 className="unidade__nome">
                <Link to={rotaUnidade}>{u.nome}</Link>
              </h3>
              <InstagramLink usuario={u.instagram} unidade={u.nome} />
            </div>

            <p className="unidade__frase">{u.frase}</p>

            <p className="unidade__descricao">{u.descricao}</p>
          </>
        )}

        <ul className="unidade__destaques">
          {u.destaques.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>

        <dl className="unidade__dados">
          <div>
            <dt>Endereço</dt>
            <dd>{u.endereco}</dd>
          </div>
          <div>
            <dt>Horários</dt>
            <dd>{u.horarios}</dd>
          </div>
        </dl>

        <div className="unidade__acoes">
          {detalhe ? (
            <>
              <Link
                className="unidade__link"
                to={`/agendamento?unidade=${slug}`}
              >
                <span>Agendar nesta unidade</span>
                <span className="unidade__link-seta" aria-hidden="true">
                  →
                </span>
              </Link>

              {u.lp ? (
                <a
                  className="unidade__link unidade__link--grade"
                  href={u.lp}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>Site da unidade</span>
                  <span className="unidade__link-seta" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ) : null}

              {u.planos ? (
                <a
                  className="unidade__link unidade__link--grade"
                  href={u.planos}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>Ver planos</span>
                  <span className="unidade__link-seta" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ) : null}
            </>
          ) : (
            <>
              {u.lp ? (
                <a
                  className="unidade__link"
                  href={u.lp}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>Conhecer unidade</span>
                  <span className="unidade__link-seta" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ) : (
                <span
                  className="unidade__link unidade__link--inativo"
                  aria-disabled="true"
                >
                  <span>Conhecer unidade</span>
                  <span className="unidade__link-seta" aria-hidden="true">
                    ↗
                  </span>
                </span>
              )}

              <a
                className="unidade__link unidade__link--grade"
                href="#grade"
              >
                <span>Ver grade de aulas</span>
                <span className="unidade__link-seta" aria-hidden="true">
                  ↓
                </span>
              </a>

              {u.planos ? (
                <a
                  className="unidade__link unidade__link--grade"
                  href={u.planos}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>Ver planos</span>
                  <span className="unidade__link-seta" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ) : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default CardUnidade;