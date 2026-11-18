// Botao/link das LPs que abre o WhatsApp da unidade com a mensagem pronta.
// Cada unidade tem o proprio numero (o das LPs antigas), diferente do numero
// geral do botao flutuante da home (components/WhatsApp).

import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { registrarEvento } from "../../lib/analytics";

type Props = { href: string; className: string; children: ReactNode };

function LinkWhatsApp({ href, className, children }: Props) {
  const { pathname } = useLocation();
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => registrarEvento("clique_whatsapp", { origem: pathname })}
    >
      {children}
    </a>
  );
}

export default LinkWhatsApp;
