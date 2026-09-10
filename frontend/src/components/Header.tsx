// Cabecalho fixo. Em cima do hero ele nasce transparente e vai escurecendo
// conforme eu rolo a pagina.

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const links = [
  { label: 'A Rede', hash: '#a-rede' },
  { label: 'Unidades', hash: '#unidades' },
  { label: 'Grade de Aulas', hash: '#grade' },
];

function Header() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  const isHome = pathname === '/';

  // A area interna tem cabecalho proprio, entao aqui eu sumo.
  const isAdmin = pathname.startsWith('/admin');

  // So a home tem foto grande no topo, so ela comeca transparente.
  const temHero = isHome;
  const solid = !temHero || scrolled;

  useEffect(() => {
    if (!temHero) return;

    const container = document.querySelector<HTMLElement>('.snap-container');
    if (!container) return;

    const onScroll = () => setScrolled(container.scrollTop > 24);

    // Primeira leitura fora do corpo do efeito, senao da setState sincrono.
    const frame = requestAnimationFrame(onScroll);
    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('scroll', onScroll);
    };
  }, [temHero, pathname]);

  const classes = [
    'header',
    solid || menuAberto ? 'header--solid' : '',
    menuAberto ? 'header--aberto' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (isAdmin) return null;

  // Fora da home os links viram /#secao, senao o hash nao leva a lugar nenhum.
  const alvo = (hash: string) => (isHome ? hash : `/${hash}`);

  return (
    <header className={classes}>
      <Link to="/" className="header__logo" onClick={() => setMenuAberto(false)}>
        <span className="header__logo-number">24</span>
        <div>
          <div className="header__logo-name">REDE</div>
          <div className="header__logo-tagline">
            Quatro unidades. Uma mesma essência.
          </div>
        </div>
      </Link>

      <button
        type="button"
        className="header__toggle"
        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={menuAberto}
        onClick={() => setMenuAberto((aberto) => !aberto)}
      >
        <span className="header__toggle-barra" />
        <span className="header__toggle-barra" />
        <span className="header__toggle-barra" />
      </button>

      <nav className="header__nav">
        {links.map((link) => (
          <a
            key={link.hash}
            href={alvo(link.hash)}
            onClick={() => setMenuAberto(false)}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <a
        href={alvo('#agendar')}
        className="header__cta"
        onClick={() => setMenuAberto(false)}
      >
        Agende uma aula
      </a>
    </header>
  );
}

export default Header;
