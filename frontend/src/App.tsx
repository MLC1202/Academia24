// Esqueleto do site: o Header aparece em tudo e as rotas trocam so o miolo.
//
// O basename vem do base do Vite: '/' na Hostinger, '/Academia24/' no
// GitHub Pages. Assim as rotas funcionam nos dois sem eu mexer aqui.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import HomePage from './pages/home/HomePage';
import UnidadesPage from './pages/unidades/UnidadesPage';
import UnidadePage from './pages/unidades/UnidadePage';
import AgendamentoPage from './pages/agendamento/AgendamentoPage';
import DuvidasPage from './pages/duvidas/DuvidasPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import RotaAdmin from './lib/RotaAdmin';
import NaoEncontradaPage from './pages/naoEncontrada/NaoEncontradaPage';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/unidades" element={<UnidadesPage />} />
        <Route path="/unidades/:slug" element={<UnidadePage />} />
        <Route path="/agendamento" element={<AgendamentoPage />} />
        <Route path="/duvidas" element={<DuvidasPage />} />
        {/* Area interna: login em duas etapas; o painel so abre logado. */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin/dashboard"
          element={<RotaAdmin>{(email) => <DashboardPage email={email} />}</RotaAdmin>}
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        {/* Qualquer rota que nao existe: pagina 404 (o servidor tambem
            responde com status 404 -- ver public/.htaccess). */}
        <Route path="*" element={<NaoEncontradaPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
