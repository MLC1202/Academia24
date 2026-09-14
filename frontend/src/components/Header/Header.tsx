// Cabecalho fixo, igual em todas as paginas: 24 REDE na esquerda e o menu
// de 3 tracinhos na direita com os 4 topicos do site.
//
// - Home: nasce transparente em cima do hero e vai escurecendo conforme eu
//   rolo.
// - Paginas internas (Unidades, Agendamento, Duvidas): ja nasce escuro e
//   ganha a trilha de volta (Home › Unidades › Alphaville).

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ehSlugUnidade, unidades } from '../../data/unidades';
import './Header.css';

// Os 4 topicos do menu.
const topicos = [
  { label: 'Home', to: '/' },
  { label: 'Unidades', to: '/unidades' },
  { label: 'Agendamento', to: '/agendamento' },
  { label: 'Dúvidas', to: '/duvidas' },
];

type Passo = { label: string; to?: string };

// Monta a trilha a partir da URL. O ultimo passo e onde eu estou (sem link).
function montarTrilha(pathname: string): Passo[] {
  const partes = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const [pagina, sub] = partes;

  if (pagina === 'unidades') {
    if (ehSlugUnidade(sub)) {
      return [
        { label: 'Home', to: '/' },
        { label: 'Unidades', to: '/unidades' },
        { label: unidades[sub].nome },
      ];
    }
    return [{ label: 'Home', to: '/' }, { label: 'Unidades' }];
  }

  if (pagina === 'agendamento') {
    return [{ label: 'Home', to: '/' }, { label: 'Agendamento' }];
  }

  if (pagina === 'duvidas') {
    return [{ label: 'Home', to: '/' }, { label: 'Dúvidas' }];
  }

  return [];
}

function Header() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  // Guardo EM QUAL rota o menu foi aberto: se a pessoa troca de pagina por
  // qualquer botao, o menu ja aparece fechado na pagina nova.
  const [menuAbertoEm, setMenuAbertoEm] = useState<string | null>(null);
  const menuAberto = menuAbertoEm === pathname;

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

  // Com o menu aberto: Esc ou clique fora do cabecalho fecham.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menuAberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbertoEm(null);
    };
    const onFora = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMenuAbertoEm(null);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onFora);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onFora);
    };
  }, [menuAberto]);

  if (isAdmin) return null;

  const fechar = () => setMenuAbertoEm(null);

  const trilha = montarTrilha(pathname);

  const classes = [
    'header',
    solid || menuAberto ? 'header--solid' : '',
    isHome ? '' : 'header--interna',
    menuAberto ? 'header--aberto' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={classes} ref={headerRef}>
      <Link to="/" className="header__logo" onClick={fechar}>
        <span className="header__logo-number">24</span>
        <div>
          <div className="header__logo-name">REDE</div>
          <div className="header__logo-tagline">
            Quatro unidades. Uma mesma essência.
          </div>
        </div>
      </Link>

      {/* Trilha de volta: so nas paginas internas (a home nao tem pra onde voltar). */}
      {trilha.length > 0 && (
        <nav className="header__trilha" aria-label="Você está aqui">
          <ol>
            {trilha.map((passo, i) => (
              <li key={passo.label}>
                {i > 0 && (
                  <span className="header__trilha-sep" aria-hidden="true">
                    ›
                  </span>
                )}
                {passo.to ? (
                  <Link
                    to={passo.to}
                    className={
                      i === 0
                        ? 'header__trilha-item header__trilha-voltar'
                        : 'header__trilha-item'
                    }
                    onClick={fechar}
                  >
                    {i === 0 && <span aria-hidden="true">←</span>}
                    <span>{passo.label}</span>
                  </Link>
                ) : (
                  <span className="header__trilha-atual" aria-current="page">
                    {passo.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <button
        type="button"
        className="header__toggle"
        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={menuAberto}
        aria-controls="menu-topicos"
        onClick={() =>
          setMenuAbertoEm((aberto) => (aberto === pathname ? null : pathname))
        }
      >
        <span className="header__toggle-barra" />
        <span className="header__toggle-barra" />
        <span className="header__toggle-barra" />
      </button>

      <nav
        id="menu-topicos"
        className="header__menu"
        aria-label="Menu principal"
        hidden={!menuAberto}
      >
        {topicos.map((t, i) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              isActive
                ? 'header__menu-item header__menu-item--ativo'
                : 'header__menu-item'
            }
            onClick={fechar}
          >
            <span className="header__menu-n">0{i + 1}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export default Header;
