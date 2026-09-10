// A home inteira. A ordem das secoes aqui e a ordem que aparece na tela;
// pra trocar de lugar e so mexer nesta lista.

import Hero from "./home-sections/Hero";
import Rede from "./home-sections/Rede";
import Unidades from "./home-sections/Unidades";
import Grade from "./home-sections/Grade";
import Bioimpedancia from "./home-sections/Bioimpedancia";
import Agendamento from "../components/Agendamento";
import Duvidas from "./home-sections/Duvidas";
import Convite from "./home-sections/Convite";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="snap-container">
      <Hero />
      <Rede />
      <Unidades />
      <Grade />
      <Bioimpedancia />
      <Agendamento />
      <Duvidas />
      <Convite />
      <Footer />
    </div>
  );
}

export default Home;
