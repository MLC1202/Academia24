// Secao da avaliacao fisica: foto com filtro vermelho a esquerda,
// texto e itens medidos a direita. A foto ainda e placeholder do Unsplash.

import "./Bioimpedancia.css";

const itens = [
  "Composição corporal",
  "Percentual de gordura",
  "Massa muscular",
  "Acompanhamento da evolução",
];

function Bioimpedancia() {
  return (
    <section className="bio snap-section" id="bioimpedancia">
      <div className="bio__foto">
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

          <a href="#agendar" className="bio__cta">
            Agendar aula experimental →
          </a>
        </div>
      </div>
    </section>
  );
}

export default Bioimpedancia;
