// Cabecalho fixo, igual em todas as paginas: as logos das duas marcas da rede
// (24wellness e Academia 24 Health Club) na esquerda e o menu fluido
// (bolinhas que descem) na direita com os 4 topicos do site.
// Logos em public/logos/ — versoes claras, porque o cabecalho e sempre escuro.
//
// - Home: nasce transparente em cima do hero e vai escurecendo conforme eu
//   rolo.
// - Paginas internas (Unidades, Agendamento, Duvidas): ja nasce escuro e
//   ganha a trilha de volta (Home › Unidades).

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FluidMenu, { type ItemMenu } from '../FluidMenu/FluidMenu';
import PlanosModal from '../PlanosModal/PlanosModal';
import { icones } from '../FluidMenu/icones';
import './Header.css';

const base = import.meta.env.BASE_URL;

// Os 4 topicos do menu.
const topicos: ItemMenu[] = [
  { label: 'Home', to: '/', icone: icones.home },
  { label: 'Unidades', to: '/unidades', icone: icones.unidades },
  { label: 'Agendamento', to: '/agendamento', icone: icones.agendamento },
  { label: 'Dúvidas', to: '/duvidas', icone: icones.duvidas },
];

type Passo = { label: string; to?: string };

// Monta a trilha a partir da URL. O ultimo passo e onde eu estou (sem link).
function montarTrilha(pathname: string): Passo[] {
  const partes = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const [pagina] = partes;

  if (pagina === 'unidades') {
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
  // Janela de escolher a unidade pros planos (botao ao lado do menu).
  const [planosAberto, setPlanosAberto] = useState(false);

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
      <Link
        to="/"
        className="header__logo"
        onClick={fechar}
        aria-label="Rede 24 — página inicial"
      >
        <img
          className="header__logo-wellness"
          src={`${base}logos/24wellness-negativo.svg`}
          alt="24wellness"
        />
        <span className="header__logo-divisor" aria-hidden="true" />
        <img
          className="header__logo-healthclub"
          src={`${base}logos/24healthclub-branco.svg`}
          alt="Academia 24 Health Club"
        />
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

      {/* Planos: abre a janela pra escolher a unidade */}
      <button
        type="button"
        className="header__planos"
        aria-haspopup="dialog"
        onClick={() => {
          fechar();
          setPlanosAberto(true);
        }}
      >
        Planos
      </button>

      <FluidMenu
        itens={topicos}
        aberto={menuAberto}
        onAlternar={() =>
          setMenuAbertoEm((aberto) => (aberto === pathname ? null : pathname))
        }
        onEscolher={fechar}
      />

      <PlanosModal
        aberto={planosAberto}
        onFechar={() => setPlanosAberto(false)}
      />
    </header>
  );
}

export default Header;
