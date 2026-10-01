// Lista das 4 unidades em zigue-zague (pagina /unidades).

import { slugsUnidades } from "../../../data/unidades";
import CardUnidade from "./CardUnidade";
import "./Unidades.css";

function ListaUnidades() {
  return (
    <section className="unidades snap-section" id="unidades">
      <div className="unidades__inner">
        <header className="unidades__head">
          <p className="unidades__eyebrow">Encontre a sua 24</p>

          <h1 className="unidades__title">
            <span className="unidades__title-destaque">Quatro unidades.</span>
            <br />
            Uma experiência para cada rotina.
            <br />
          </h1>

          <div className="unidades__intro">
            <p>
              Compare os diferenciais e escolha a unidade mais próxima ou mais
              alinhada ao
              <strong> seu jeito de treinar.</strong>
            </p>
          </div>
        </header>

        <div className="unidades__lista">
          {slugsUnidades.map((slug, i) => (
            <CardUnidade key={slug} slug={slug} invertida={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ListaUnidades;
