// Menu "fluido": uma bolinha com o icone de menu que, ao clicar, solta as
// outras bolinhas pra baixo, uma encaixada na outra, formando uma capsula.
//
// Adaptado do fluid-menu (feito em Tailwind/shadcn) pro CSS puro do site.
// Diferenca que eu quis: passando o mouse (ou o foco do teclado) numa
// bolinha, aparece o nome da secao do lado. No celular, sem mouse, os nomes
// ja aparecem todos com o menu aberto.
//
// Quem controla se esta aberto e o Header (ele fecha ao trocar de pagina,
// com Esc e com clique fora).

import type { CSSProperties, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { icones } from "./icones";
import "./FluidMenu.css";

export type ItemMenu = {
  label: string;
  to: string;
  icone: ReactNode;
};

type Props = {
  itens: ItemMenu[];
  aberto: boolean;
  onAlternar: () => void;
  onEscolher: () => void;
};

function FluidMenu({ itens, aberto, onAlternar, onEscolher }: Props) {
  return (
    <div className={aberto ? "fluid fluid--aberto" : "fluid"}>
      {/* Primeira bolinha: sempre visivel, abre e fecha */}
      <button
        type="button"
        className="fluid__bolha fluid__toggle"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        aria-controls="menu-topicos"
        onClick={onAlternar}
      >
        <span className="fluid__icone fluid__icone--menu">{icones.menu}</span>
        <span className="fluid__icone fluid__icone--fechar">{icones.fechar}</span>
      </button>

      {/* As outras descem de tras da primeira. Fechado, ficam inertes (fora
          do Tab e do leitor de tela). */}
      <nav id="menu-topicos" aria-label="Menu principal" inert={!aberto}>
        {itens.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onEscolher}
            className={({ isActive }) =>
              [
                "fluid__item",
                i === itens.length - 1 ? "fluid__item--ultimo" : "",
                isActive ? "fluid__item--ativo" : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
            style={{ "--i": i + 1, "--z": 40 - i } as CSSProperties}
          >
            <span className="fluid__bolha">
              <span className="fluid__icone">{item.icone}</span>
            </span>
            {/* O nome da secao, do lado da bolinha */}
            <span className="fluid__rotulo">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default FluidMenu;
