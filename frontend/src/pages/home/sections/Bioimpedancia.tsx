// Secao da avaliacao fisica: foto com filtro vermelho a esquerda,
// texto e itens medidos a direita. Foto em public/imagens/bioimpedancia.jpg
// (pra trocar: mesmo nome, mesma pasta). O BASE_URL garante o caminho
// certo tanto na Hostinger quanto no GitHub Pages.

import { Link } from "react-router-dom";
import "./Bioimpedancia.css";

const foto = `${import.meta.env.BASE_URL}imagens/bioimpedancia.jpg`;

const itens = [
  "Composição corporal",
  "Percentual de gordura",
  "Massa muscular",
  "Acompanhamento da evolução",
];

function Bioimpedancia() {
  return (
    <section className="bio snap-section" id="bioimpedancia">
      <div
        className="bio__foto"
        style={{
          backgroundImage: `linear-gradient(rgba(237, 26, 61, 0.82), rgba(237, 26, 61, 0.82)), url(${foto})`,
        }}
      >
        <p className="bio__frase">
          Evolução
          <br />
          que você
          <br />
          consegue
          <br />
          ver.
        </p>
      </div>

      <div className="bio__conteudo">
        <div className="bio__inner">
          <p className="bio__eyebrow">Avaliação física com bioimpedância</p>

          <h2 className="bio__title">Treine com direção, não no escuro.</h2>

          <p className="bio__subtitle">
            A bioimpedância ajuda a transformar objetivos em informações que
            podem ser acompanhadas ao longo do tempo.
          </p>

          <ul className="bio__itens">
            {itens.map((item) => (
              <li key={item} className="bio__item">
                {item}
              </li>
            ))}
          </ul>

          <Link to="/agendamento" className="bio__cta">
            Agendar aula experimental →
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Bioimpedancia;
