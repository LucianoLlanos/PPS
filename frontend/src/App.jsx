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
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
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
          <div className="app-container">
            <Routes>
              {/* Vista principal pública - Catálogo de productos para clientes */}
              <Route path="/" element={<HomeProducts />} />
              <Route path="/carrito" element={<Cart />} />
              
              {/* Rutas protegidas para usuarios autenticados */}
              <Route path="/servicios" element={<ProtectedRoute><ServiciosPostVenta /></ProtectedRoute>} />
              
              {/* Rutas administrativas - Solo para administradores */}
              <Route path="/usuarios" element={<ProtectedRoute requiredRoleId={3}><Usuarios /></ProtectedRoute>} />
              <Route path="/productos" element={<ProtectedRoute requiredRoleId={3}><Productos /></ProtectedRoute>} />
              <Route path="/pedidos" element={<ProtectedRoute requiredRoleId={3}><Pedidos /></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute requiredRoleId={3}><Clientes /></ProtectedRoute>} />
              <Route path="/servicios-admin" element={<ProtectedRoute requiredRoleId={3}><ServiciosAdmin /></ProtectedRoute>} />
              <Route path="/ventas-analytics" element={<ProtectedRoute requiredRoleId={3}><VentasAnalytics /></ProtectedRoute>} />
            </Routes>
            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App
