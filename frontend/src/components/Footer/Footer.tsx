// Rodape padrao: aparece no fim de todas as paginas (o admin nao usa).

import { Link } from 'react-router-dom';
import { EMAIL_SAC, POLITICA_PRIVACIDADE } from '../../data/site';
import { slugsUnidades, unidades } from '../../data/unidades';
import { abrirPreferenciasCookies } from '../../lib/consentimento';
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
        <Link to="/agendamento" className="footer__cta">
          Agendar aula →
        </Link>
      </div>
      <ul className="footer__unidades">
        {slugsUnidades.map((slug) => (
          <li key={slug}>
            <span className="footer__unidade-nome">{unidades[slug].nome}</span>
            <span className="footer__cnpj">CNPJ {unidades[slug].cnpj}</span>
          </li>
        ))}
      </ul>
      <div className="footer__base">
        <a href={`mailto:${EMAIL_SAC}`} className="footer__privacidade">
          SAC: {EMAIL_SAC}
        </a>
        {/* <a> e nao <Link>: e um arquivo estatico, nao uma rota do React */}
        <a
          href={`${base}${POLITICA_PRIVACIDADE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="footer__privacidade"
        >
          Política de privacidade
        </a>
        <button
          type="button"
          className="footer__privacidade footer__privacidade--botao"
          onClick={abrirPreferenciasCookies}
        >
          Preferências de cookies
        </button>
      </div>
    </footer>
  );
}

export default Footer;
