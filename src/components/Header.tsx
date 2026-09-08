import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <Link to="/" className="header__logo">
        <span className="header__logo-number">24</span>
        <div>
          <div className="header__logo-name">REDE</div>
          <div className="header__logo-tagline">Quatro unidades. Uma mesma essência.</div>
        </div>
        
      </Link>

      <nav className="header__nav">
        <a href="#a-rede">A Rede</a>
        <a href="#unidades">Unidades</a>
        <a href="#grade">Grade de Aulas</a>
        <a href="#duvidas">Dúvidas</a>
      </nav>

      <a href="#agendar" className="header__cta">
        Agende uma aula
      </a>
      
    </header>
  );
}

export default Header;