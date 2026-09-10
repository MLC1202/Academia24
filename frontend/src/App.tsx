// Esqueleto do site: o Header aparece em tudo e as rotas trocam so o miolo.
//
// O basename vem do base do Vite: '/' na Hostinger, '/Academia24/' no
// GitHub Pages. Assim as rotas funcionam nos dois sem eu mexer aqui.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Area interna, ainda sem login de verdade. */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        {/* Qualquer rota que nao existe volta pra home. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
