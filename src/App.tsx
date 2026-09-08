// function App() { 
//   return <div>Academia 24</div> }

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Alphaville from './pages/unidades/Alphaville';
import Norte from './pages/unidades/Norte';
import Cambui from './pages/unidades/Cambui';
import Lagoa from './pages/unidades/Lagoa';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Footer from './components/Footer';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/unidades/alphaville" element={<Alphaville />} />
        <Route path="/unidades/norte" element={<Norte />} />
        <Route path="/unidades/cambui" element={<Cambui />} />
        <Route path="/unidades/lagoa" element={<Lagoa />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/components/footer" element={<Footer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;