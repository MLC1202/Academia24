import "./Rede.css";

function Rede() {
  return (
    <section className="rede snap-section" id="a-rede">
      <div className="rede__eyebrow">QUATRO UNIDADES. UMA MESMA ESSÊNCIA.</div>

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
  );
}

export default Rede;