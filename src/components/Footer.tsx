import './Footer.css';

function Footer() {
    return (
      <footer className="footer">
        <div>
          <span className="footer__logo-number">24</span> REDE
          <div className="footer__tagline">Quatro unidades. Uma mesma essência.</div>
        </div>
        <div className="footer__unidades">Alphaville · Norte · Cambuí · Lagoa</div>
        <a href="#agendar" className="footer__cta">Agendar aula ↑</a>
      </footer>
    );
  }
  
  export default Footer;