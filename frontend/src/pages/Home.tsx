import Hero from "./home-sections/Hero";
import Rede from "./home-sections/Rede";
import Unidades from "./home-sections/Unidades";
import Grade from "./home-sections/Grade";
import Agendamento from "../components/Agendamento";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="snap-container">
      <Hero />
      <Rede />
      <Unidades />
      <Grade />
      <Agendamento />
      <Footer />
    </div>
  );
}

export default Home;
