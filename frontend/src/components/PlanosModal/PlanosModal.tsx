// Janela "Planos": abre por cima da pagina com as 4 unidades (foto + nome)
// e cada card leva pro link de pagamento/planos da unidade (sistema Pacto).
//
// Uso o <dialog> nativo com showModal(): ele ja resolve Esc pra fechar,
// prende o foco dentro da janela e deixa o resto da pagina inerte.
// Clique no fundo escuro (fora da caixa) tambem fecha.

import { useEffect, useRef } from "react";
import { slugsUnidades, unidades } from "../../data/unidades";
import "./PlanosModal.css";

type Props = {
  aberto: boolean;
  onFechar: () => void;
};

// So entram as unidades que tem link de planos preenchido.
const comPlanos = slugsUnidades.filter((slug) => unidades[slug].planos);

function PlanosModal({ aberto, onFechar }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  // O estado "aberto" mora no Header; aqui eu so sincronizo o <dialog>.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (aberto && !dialog.open) dialog.showModal();
    if (!aberto && dialog.open) dialog.close();
  }, [aberto]);

  // Enquanto a janela esta aberta, a pagina de tras nao rola.
  useEffect(() => {
    if (!aberto) return;
    const html = document.documentElement;
    const antes = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = antes;
    };
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      className="planos"
      aria-labelledby="planos-titulo"
      // Esc (ou qualquer outro jeito de fechar) avisa o Header
      onClose={onFechar}
      // Clique no fundo: o alvo e o proprio <dialog>, nao a caixa de dentro
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="planos__caixa">
        <div className="planos__topo">
          <div>
            <h2 id="planos-titulo" className="planos__titulo">
              Escolha sua unidade
            </h2>
            <p className="planos__sub">
              Você vai para a página de planos da unidade escolhida.
            </p>
          </div>
          <button
            type="button"
            className="planos__fechar"
            aria-label="Fechar"
            onClick={onFechar}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <ul className="planos__lista">
          {comPlanos.map((slug) => {
            const u = unidades[slug];
            return (
              <li key={slug}>
                {/* Link externo: nova aba e sem acesso ao window.opener */}
                <a
                  className="planos__card"
                  href={u.planos}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onFechar}
                >
                  <img
                    className="planos__foto"
                    src={u.foto}
                    alt=""
                    loading="lazy"
                  />
                  <span className="planos__info">
                    <span className="planos__marca">{u.marca}</span>
                    <span className="planos__nome">{u.nome}</span>
                    <span className="planos__local">{u.local}</span>
                    <span className="planos__cta">
                      Ver planos <span aria-hidden="true">→</span>
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}

export default PlanosModal;
