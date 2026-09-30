// /unidades/<slug>: uma unidade so, com a grade dela embaixo.
// Slug que nao existe volta pra lista de unidades.

import { Navigate, useParams } from "react-router-dom";
import Pagina from "../../components/Pagina/Pagina";
import CardUnidade from "./components/CardUnidade";
import GradeAulas from "./components/GradeAulas";
import InstagramLink from "../../components/InstagramLink/InstagramLink";
import { ehSlugUnidade, unidades } from "../../data/unidades";
import "./components/Unidades.css";

function UnidadePage() {
  const { slug } = useParams();

  if (!ehSlugUnidade(slug)) return <Navigate to="/unidades" replace />;

  const u = unidades[slug];

  return (
    <Pagina>
      <section className="unidades unidades--detalhe snap-section">
        <div className="unidades__inner">
          <header className="unidades__head">
            <p className="unidades__eyebrow">
              {u.marca} · Unidade {u.n}
              <InstagramLink
                usuario={u.instagram}
                unidade={u.nome}
                className="unidades__insta"
              />
            </p>

            <h1 className="unidades__title">
              <span className="unidades__title-destaque">{u.nome}.</span>
              <br />
              {u.local}
            </h1>

            <div className="unidades__intro">
              <p>
                <strong>{u.frase}</strong> {u.descricao}
              </p>
            </div>
          </header>

          <div className="unidades__lista">
            <CardUnidade slug={slug} detalhe />
          </div>
        </div>
      </section>

      <GradeAulas slugs={[slug]} />
    </Pagina>
  );
}

export default UnidadePage;
