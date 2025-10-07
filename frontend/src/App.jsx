import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Usuarios from './components/Usuarios';
import Productos from './components/Productos';
import Pedidos from './components/Pedidos';
import Clientes from './components/Clientes';
import Login from './components/Login';
import HomeProducts from './components/HomeProducts';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

import useAuthStore from './store/useAuthStore';
import cart from './utils/cart';
import { useEffect, useState } from 'react';

function App() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [cartCount, setCartCount] = useState(cart.getCount());

  useEffect(() => {
    const h = (e) => setCartCount(cart.getCount());
    window.addEventListener('cart:updated', h);
    return () => window.removeEventListener('cart:updated', h);
  }, []);

  const handleLogin = (user) => {
    // noop: store already updated by Login
  };
  return (
    <Router>
      <div className="container py-4" style={{paddingTop: '80px'}}>
        <Header />
        <Routes>
          <Route path="/usuarios" element={<ProtectedRoute requiredRoleId={3}><Usuarios /></ProtectedRoute>} />
          <Route path="/productos" element={<ProtectedRoute requiredRoleId={3}><Productos /></ProtectedRoute>} />
          <Route path="/pedidos" element={<ProtectedRoute requiredRoleId={3}><Pedidos /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute requiredRoleId={3}><Clientes /></ProtectedRoute>} />
          {/* Ruta de Vendedor deshabilitada */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/" element={<HomeProducts />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App
