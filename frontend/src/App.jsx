import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Usuarios from './components/Usuarios';
import Productos from './components/Productos';
import Pedidos from './components/Pedidos';
import Clientes from './components/Clientes';
import Login from './components/Login';
import Register from './components/Register';
import HomeProducts from './components/HomeProducts';
import Cart from './components/Cart';
import ServiciosPostVenta from './components/ServiciosPostVenta';
import ServiciosAdmin from './components/ServiciosAdmin';
import VentasAnalytics from './components/admin/VentasAnalytics';
import AcercaDe from './components/AcercaDe';
import EmpresaAdmin from './components/admin/EmpresaAdmin';
import CarouselAdmin from './components/admin/CarouselAdmin';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import PageWrapper from './components/PageWrapper';
import './App.css';

import useAuthStore from './store/useAuthStore';
import cart from './utils/cart';
import { useEffect, useState } from 'react';

function App() {
  // user and clearAuth are currently unused in this component; keep hooks if needed later
  useAuthStore((s) => s.user);
  useAuthStore((s) => s.clearAuth);
  const [_, setCartCount] = useState(cart.getCount());

  useEffect(() => {
    const h = () => setCartCount(cart.getCount());
    window.addEventListener('cart:updated', h);
    return () => window.removeEventListener('cart:updated', h);
  }, []);

  const handleLogin = () => {
    // Store already updated by Login component
  };
  
  return (
    <Router>
      <Header />
      <Routes>
        {/* Rutas públicas principales */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas con layout principal */}
        <Route path="/*" element={
          <Routes>
            {/* Vista principal pública - Sin contenedor para permitir carrusel full-width */}
            <Route path="/" element={<HomeProducts />} />
            
            {/* Otras rutas con contenedor normal */}
            <Route path="/carrito" element={<PageWrapper><Cart /></PageWrapper>} />
            <Route path="/acerca-de" element={<PageWrapper><AcercaDe /></PageWrapper>} />
            
            {/* Rutas protegidas para usuarios autenticados */}
            <Route path="/servicios" element={<PageWrapper><ProtectedRoute><ServiciosPostVenta /></ProtectedRoute></PageWrapper>} />
            
            {/* Rutas administrativas - Solo para administradores */}
            <Route path="/usuarios" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><Usuarios /></ProtectedRoute></PageWrapper>} />
            <Route path="/productos" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><Productos /></ProtectedRoute></PageWrapper>} />
            <Route path="/pedidos" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><Pedidos /></ProtectedRoute></PageWrapper>} />
            <Route path="/clientes" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><Clientes /></ProtectedRoute></PageWrapper>} />
            <Route path="/servicios-admin" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><ServiciosAdmin /></ProtectedRoute></PageWrapper>} />
            <Route path="/ventas-analytics" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><VentasAnalytics /></ProtectedRoute></PageWrapper>} />
            <Route path="/empresa-admin" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><EmpresaAdmin /></ProtectedRoute></PageWrapper>} />
            <Route path="/carousel-admin" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><CarouselAdmin /></ProtectedRoute></PageWrapper>} />
          </Routes>
        } />
      </Routes>
    </Router>
  );
}

export default App
