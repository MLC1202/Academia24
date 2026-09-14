// /agendamento: o formulario da aula experimental.
// Todos os botoes de "agendar" do site trazem pra ca. Se vier de uma unidade
// (/agendamento?unidade=alphaville), o formulario ja abre com ela escolhida.

import Pagina from "../../components/Pagina/Pagina";
import FormAgendamento from "./FormAgendamento";

function AgendamentoPage() {
  return (
    <Pagina>
      <FormAgendamento />
    </Pagina>
  );
}

export default AgendamentoPage;
