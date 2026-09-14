// Casca das paginas internas (Unidades, Agendamento, Duvidas): o container
// que rola + o footer padrao no fim. O Header fica fora, no App.
//
// A classe .pagina ajusta o --header-height, que as secoes usam pra nao
// ficarem escondidas atras do cabecalho (no mobile ele tem 2 linhas).

import type { ReactNode } from 'react';
import Footer from '../Footer/Footer';

function Pagina({ children }: { children: ReactNode }) {
  return (
    <div className="snap-container pagina">
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export default Pagina;
