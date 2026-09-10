// Faixa vermelha de fechamento: chamada a esquerda, cartao de agendamento a direita.

import "./Convite.css";

function Convite() {
  return (
    <section className="convite" id="convite">
      <div className="convite__inner">
        <div className="convite__texto">
          <p className="convite__eyebrow">Seu próximo passo</p>

          <h2 className="convite__title">Viva a experiência 24.</h2>

          <p className="convite__subtitle">
            Conheça os ambientes e converse com nossa equipe sobre a unidade e o
            plano que combinam com sua rotina.
          </p>
        </div>

        <a href="#agendar" className="convite__card">
          <span className="convite__card-eyebrow">Quero agendar</span>

          <span className="convite__card-title">Minha aula</span>

          <span className="convite__cta">Sem compromisso →</span>
        </a>
      </div>
    </section>
  );
}

export default Convite;
