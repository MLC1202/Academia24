import "./Hero.css";

function Hero() {
  return (
    <section className="hero snap-section" id="hero">
      <div className="hero__content">
        <div className="hero__location">SÃO PAULO · ALPHAVILLE · CAMPINAS</div>
        <h1 className="hero__title">
          Seu bem-estar.
          <br />
          <span className="hero__title-accent">Seu ritmo. Sua 24.</span>
        </h1>
        <p className="hero__subtitle">
          Quatro unidades completas, cada uma com personalidade própria e o
          mesmo compromisso: oferecer estrutura, acolhimento e condições reais
          para você evoluir.
        </p>
        <div className="hero__actions">
          <a href="#agendar" className="hero__btn-primary">
            Agendar aula experimental
          </a>
          <a href="#unidades" className="hero__btn-secondary">
            Escolher minha unidade
          </a>
        </div>
      </div>

      <div className="hero__stats">
        <div className="hero__stat">
          <span className="hero__stat-number">04</span>
          <span className="hero__stat-label">Unidades</span>
        </div>
        <div className="hero__stat">
          <span className="hero__stat-number">02</span>
          <span className="hero__stat-label">Cidades</span>
        </div>
        <div className="hero__stat">
          <span className="hero__stat-number">01</span>
          <span className="hero__stat-label">Comunidade</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;