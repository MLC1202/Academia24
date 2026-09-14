// /unidades: as 4 unidades em zigue-zague e a grade de aulas embaixo.

import Pagina from "../../components/Pagina/Pagina";
import ListaUnidades from "./components/ListaUnidades";
import GradeAulas from "./components/GradeAulas";

function UnidadesPage() {
  return (
    <Pagina>
      <ListaUnidades />
      <GradeAulas />
    </Pagina>
  );
}

export default UnidadesPage;
