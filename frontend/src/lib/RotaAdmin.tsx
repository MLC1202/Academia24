// Porteiro do /admin: so mostra a pagina se o servidor disser que tem
// alguem logado. Senao, manda pro /admin/login.
//
// IMPORTANTE: isto e conforto de tela, NAO e a seguranca. Quem protege os
// dados e o backend (exigir_admin() em cada rota). Mesmo que alguem burle
// esta tela, a API recusa qualquer gravacao sem sessao valida.

import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { buscarSessao, SEM_API, type Sessao } from './api';

type Estado =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; sessao: Sessao };

function RotaAdmin({ children }: { children: (email: string | null) => ReactNode }) {
  const [estado, setEstado] = useState<Estado>(
    SEM_API ? { status: 'pronto', sessao: { logado: true, aguardandoMfa: false, email: null } } : { status: 'carregando' },
  );

  useEffect(() => {
    if (SEM_API) return; // previa no GitHub Pages: nao ha backend nem dados reais
    let ativo = true;
    buscarSessao()
      .then((sessao) => ativo && setEstado({ status: 'pronto', sessao }))
      .catch(() => ativo && setEstado({ status: 'erro' }));
    return () => {
      ativo = false;
    };
  }, []);

  if (estado.status === 'carregando') {
    return <div className="admin admin--centro" aria-live="polite">Verificando acesso…</div>;
  }
  if (estado.status === 'erro') {
    return (
      <div className="admin admin--centro" role="alert">
        Não foi possível falar com o servidor. Tente de novo em instantes.
      </div>
    );
  }
  if (!estado.sessao.logado) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children(estado.sessao.email)}</>;
}

export default RotaAdmin;
