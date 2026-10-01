// /unidades/<slug>: as paginas de cada unidade SAIRAM em 01/10/2026 (decisao
// da dona/Matheus: um site so, tudo na pagina /unidades).
//
// Este componente so existe pra link antigo/compartilhado nao quebrar: manda
// pra /unidades#<slug>, que rola ate o card daquela unidade. No servidor o
// public/.htaccess ja faz o mesmo com 301 (isto aqui cobre o "npm run dev" e
// a previa do GitHub Pages).

import { Navigate, useParams } from "react-router-dom";

function UnidadePage() {
  const { slug = "" } = useParams();
  return <Navigate to={`/unidades#${encodeURIComponent(slug)}`} replace />;
}

export default UnidadePage;
