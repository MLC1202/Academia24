// Manda um page_view ao GA a cada troca de rota. Numa SPA o navegador nao
// recarrega a pagina, entao o GA sozinho so veria a primeira.
//
// Fica no App.tsx DEPOIS das <Routes>: os efeitos rodam na ordem, entao o
// useSeo da pagina ja trocou o document.title quando o page_view sai.
// Chamar iniciarAnalytics aqui tambem cobre quem entrou por /admin e depois
// foi pra uma pagina publica.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { iniciarAnalytics, registrarPagina } from "../lib/analytics";

function RastreioPaginas() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (iniciarAnalytics(pathname)) registrarPagina(pathname);
  }, [pathname]);

  return null;
}

export default RastreioPaginas;
