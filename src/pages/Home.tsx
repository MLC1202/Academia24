import Hero from "./home-sections/Hero";
import Rede from "./home-sections/Rede";
import Agendar from "./home-sections/Agendar";

function Home() {
  return (
    <div className="snap-container">
      <Hero />
      <Rede />
      <Agendar />
    </div>
  );
}

export default Home;