// Rodape padrao: aparece no fim de todas as paginas (o admin nao usa).

import { Link } from 'react-router-dom';
import { POLITICA_PRIVACIDADE } from '../../data/site';
import './Footer.css';

const base = import.meta.env.BASE_URL;

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__topo">
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
      </div>
      <div className="footer__base">
        {/* <a> e nao <Link>: e um arquivo estatico, nao uma rota do React */}
        <a
          href={`${base}${POLITICA_PRIVACIDADE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="footer__privacidade"
        >
          Política de privacidade
        </a>
      </div>
    </footer>
  );
}

export default Footer;
