// A home. A ordem das secoes aqui e a ordem que aparece na tela;
// pra trocar de lugar e so mexer nesta lista.
//
// Unidades, agendamento e duvidas sao paginas proprias (src/pages/).

import Hero from "./sections/Hero";
import Rede from "./sections/Rede";
import Bioimpedancia from "./sections/Bioimpedancia";
import Convite from "./sections/Convite";
import Footer from "../../components/Footer/Footer";

function HomePage() {
  return (
    <div className="snap-container">
      <Hero />
      <Rede />
      <Bioimpedancia />
      <Convite />
      <Footer />
    </div>
  );
}

export default HomePage;
