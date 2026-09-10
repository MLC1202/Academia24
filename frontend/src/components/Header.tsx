import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { unidades, ehSlugUnidade } from '../unidades';
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

  // a area interna tem cabecalho proprio
  const isAdmin = pathname.startsWith('/admin');

  // /unidades/<slug> -> cabecalho da unidade, com trilha de volta
  const encontrado = pathname.match(/^\/unidades\/([^/]+)\/?$/);
  const slug =
    encontrado && ehSlugUnidade(encontrado[1]) ? encontrado[1] : null;
  const unidade = slug ? unidades[slug] : null;

  // paginas com foto grande no topo comecam transparentes
  const temHero = isHome || Boolean(unidade);
  const solid = !temHero || scrolled;

  useEffect(() => {
    if (!temHero) return;

    const container = document.querySelector<HTMLElement>('.snap-container');
    if (!container) return;

    const onScroll = () => setScrolled(container.scrollTop > 24);

    // leitura inicial fora do corpo do efeito (evita setState sincrono)
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
    unidade ? 'header--unidade' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (isAdmin) return null;

  // ---------- cabecalho das landing pages ----------
  if (unidade) {
    return (
      <header className={classes}>
        <Link to="/" className="header__logo">
          <span className="header__logo-number">24</span>
          <div>
            <div className="header__logo-name">{unidade.marca}</div>
            <div className="header__logo-tagline">
              Unidade {unidade.nome} · {unidade.cidade}
            </div>
          </div>
        </Link>

        <nav className="header__trilha" aria-label="Você está aqui">
          <Link to="/" className="header__trilha-voltar">
            <span aria-hidden="true">←</span>
            <span>Home</span>
          </Link>
          <span className="header__trilha-sep" aria-hidden="true">
            ›
          </span>
          <span className="header__trilha-atual" aria-current="page">
            {unidade.nome}
          </span>
        </nav>
      </header>
    );
  }

  // ---------- cabecalho da home ----------
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
