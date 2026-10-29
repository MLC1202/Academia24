// Aviso de cookies (LGPD): o Google Analytics so carrega depois do "Aceitar".
// Aparece enquanto nao houver escolha salva (ou se a versao do texto mudou) e
// reabre pelo "Preferencias de cookies" do rodape.
// "Aceitar" e "Recusar" tem o mesmo peso visual de proposito: o guia de
// cookies da ANPD considera esconder o "Recusar" um padrao enganoso.

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { POLITICA_PRIVACIDADE } from "../../data/site";
import {
  EVENTO_ABRIR_AVISO,
  gravarConsentimento,
  lerConsentimento,
} from "../../lib/consentimento";
import { ehCaminhoAdmin } from "../../lib/analytics-regras";
import {
  iniciarAnalytics,
  registrarPagina,
  revogarAnalytics,
} from "../../lib/analytics";
import "./AvisoCookies.css";

function AvisoCookies() {
  const { pathname } = useLocation();
  const [aberto, setAberto] = useState(() => lerConsentimento() === null);
  const caixa = useRef<HTMLElement>(null);
  // Quem reabriu o aviso (o botao do rodape): o foco volta pra ele ao fechar,
  // senao quem navega por teclado ou leitor de tela cai no topo da pagina.
  const quemAbriu = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const abrir = () => {
      quemAbriu.current = document.activeElement as HTMLElement | null;
      setAberto(true);
    };
    window.addEventListener(EVENTO_ABRIR_AVISO, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_AVISO, abrir);
  }, []);

  useEffect(() => {
    if (aberto && quemAbriu.current) caixa.current?.focus();
  }, [aberto]);

  if (!aberto || ehCaminhoAdmin(pathname)) return null;

  function fechar() {
    setAberto(false);
    quemAbriu.current?.focus();
    quemAbriu.current = null;
  }

  function aceitar() {
    // Quem ja tinha aceitado e so reabriu o aviso: o GA ja mandou o
    // page_view desta pagina, nao manda de novo.
    const jaAceito = lerConsentimento() === "aceito";
    gravarConsentimento("aceito");
    if (!jaAceito && iniciarAnalytics(pathname)) registrarPagina(pathname);
    fechar();
  }

  function recusar() {
    const anterior = lerConsentimento();
    gravarConsentimento("recusado");
    // Quem tinha aceitado: apaga os cookies e recarrega pra tirar o gtag.js
    // da memoria (desligar o script ja carregado e mais fragil).
    if (anterior === "aceito") {
      revogarAnalytics();
      window.location.reload();
      return;
    }
    fechar();
  }

  return (
    <section
      ref={caixa}
      tabIndex={-1}
      className="aviso-cookies"
      role="region"
      aria-label="Aviso de cookies"
    >
      <p className="aviso-cookies__texto">
        Usamos o Google Analytics para medir visitas ao site.{" "}
        <strong>
          Os dados de navegação são enviados ao Google e podem ser tratados nos
          Estados Unidos e em outros países.
        </strong>{" "}
        Ao clicar em Aceitar, você consente com esse uso e com a transferência
        internacional. Saiba mais na{" "}
        {/* <a> e nao <Link>: e um arquivo estatico, nao uma rota do React */}
        <a
          href={`${import.meta.env.BASE_URL}${POLITICA_PRIVACIDADE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="aviso-cookies__link"
        >
          Política de Privacidade
        </a>
        .
      </p>
      <div className="aviso-cookies__botoes">
        <button
          type="button"
          className="aviso-cookies__botao"
          onClick={recusar}
        >
          Recusar
        </button>
        <button
          type="button"
          className="aviso-cookies__botao"
          onClick={aceitar}
        >
          Aceitar
        </button>
      </div>
    </section>
  );
}

export default AvisoCookies;
