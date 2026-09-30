// Rodape padrao: aparece no fim de todas as paginas (o admin nao usa).

import { Link } from 'react-router-dom';
import './Footer.css';

const base = import.meta.env.BASE_URL;

function Footer() {
  return (
    <footer className="footer">
      <div>
        <div className="footer__logos">
          <img
            className="footer__logo-wellness"
            src={`${base}logos/24wellness-negativo.svg`}
            alt="24wellness"
          />
          <span className="footer__logo-divisor" aria-hidden="true" />
          <img
            className="footer__logo-healthclub"
            src={`${base}logos/24healthclub-branco.svg`}
            alt="Academia 24 Health Club"
          />
        </div>
        <div className="footer__tagline">Quatro unidades. Uma mesma essência.</div>
      </div>
      <div className="footer__unidades">Alphaville · Norte · Cambuí · Lagoa</div>
      <Link to="/agendamento" className="footer__cta">
        Agendar aula →
      </Link>
    </footer>
  );
}

export default Footer;
