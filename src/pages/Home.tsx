import "./Home.css";

function Home() {
  return (
    //HOME
    <div className="snap-container">
      <section className="hero snap-section" id="hero">
        <div className="hero__content">
          <div className="hero__location">
            SÃO PAULO · ALPHAVILLE · CAMPINAS
          </div>
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
      
      <section className="rede snap-section" id="a-rede"> 
        <div className="rede__eyebrow">
          QUATRO UNIDADES. UMA MESMA ESSÊNCIA.
        </div>

        <h2 className="rede__title">Uma rede feita para caber na sua vida.</h2>

        <div className="rede__text">
          <p>
            A Rede 24 reúne unidades com identidades próprias, conectadas pelo
            mesmo compromisso com estrutura, acolhimento e resultado. Em
            Alphaville, a experiência 24 Wellness. Nas unidades Norte, Cambuí e
            Lagoa, a tradição 24 Health Club.
          </p>
          <p>
            Você escolhe a unidade que combina com seu dia a dia. Em todas elas,
            encontra avaliação física com bioimpedância e uma equipe pronta para
            acompanhar sua evolução.
          </p>
        </div>

        <div className="rede__cards">
          <div className="rede__card">
            <div className="rede__card-number">01</div>
            <h3 className="rede__card-title">Estrutura de verdade</h3>
            <p className="rede__card-text">
              Unidades amplas, organizadas e preparadas para diferentes
              objetivos e níveis de treino.
            </p>
          </div>
          <div className="rede__card">
            <div className="rede__card-number">02</div>
            <h3 className="rede__card-title">Equipamentos reconhecidos</h3>
            <p className="rede__card-text">
              Parques diversificados com marcas como Life Fitness, Hammer
              Strength e Technogym, conforme a unidade.
            </p>
          </div>
          <div className="rede__card">
            <div className="rede__card-number">03</div>
            <h3 className="rede__card-title">Avaliação com bioimpedância</h3>
            <p className="rede__card-text">
              Acompanhe composição corporal, percentual de gordura, massa
              muscular e sua evolução.
            </p>
          </div>
          <div className="rede__card">
            <div className="rede__card-number">| 04</div>
            <h3 className="rede__card-title">Atendimento próximo</h3>
            <p className="rede__card-text">
              Profissionais presentes para acolher, orientar e fazer você se
              sentir parte da comunidade.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
