// /unidades: as 4 unidades em zigue-zague e a grade de aulas embaixo.
// /unidades#norte (link antigo de /unidades/norte ou o "Ver unidade" da
// grade) rola ate o card daquela unidade.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import Pagina from "../../components/Pagina/Pagina";
import ListaUnidades from "./components/ListaUnidades";
import GradeAulas from "./components/GradeAulas";
import { SEO } from "../../data/seo";
import { useSeo } from "../../lib/useSeo";

function UnidadesPage() {
  useSeo(SEO.unidades);
  const { hash } = useLocation();

  // O navegador tenta rolar ate o #id antes do React desenhar a pagina e nao
  // acha nada; entao eu rolo depois que os cards existem.
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const quadro = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(quadro);
  }, [hash]);

  return (
    <Pagina>
      <ListaUnidades />
      <GradeAulas />
    </Pagina>
  );
}

export default UnidadesPage;
