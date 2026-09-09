import Hero from "./home-sections/Hero";
import Rede from "./home-sections/Rede";
import Unidades from "./home-sections/Unidades";
import Agendar from "./home-sections/Agendar";

function Home() {
  return (
    <div className="snap-container">
      <Hero />
      <Rede />
      <Unidades />
      <Agendar />
    </div>
  );
}

export default Home;