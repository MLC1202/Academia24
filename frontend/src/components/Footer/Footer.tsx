// Rodape padrao: aparece no fim de todas as paginas (o admin nao usa).

import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div>
        <span className="footer__logo-number">24</span> REDE
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
