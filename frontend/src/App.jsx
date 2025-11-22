import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Usuarios from './components/Usuarios';
import Productos from './components/Productos';
import Pedidos from './components/Pedidos';
import PedidoDetail from './components/PedidoDetail';
import PedidosDebug from './components/PedidosDebug';
import Clientes from './components/Clientes';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Register from './components/Register';
import HomeProducts from './components/HomeProducts';
import PageFade from './components/PageFade';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Favoritos from './components/Favoritos';
import ServiciosPostVenta from './components/ServiciosPostVenta';
import ServiciosAdmin from './components/ServiciosAdmin';
import ServicioDetail from './components/ServicioDetail';
import VentasAnalytics from './components/admin/VentasAnalytics';
import AcercaDe from './components/AcercaDe';
import EmpresaAdmin from './components/admin/EmpresaAdmin';
import CarouselAdmin from './components/admin/CarouselAdmin';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import GlobalSnackbar from './components/GlobalSnackbar';
import Footer from './components/Footer';
import PageWrapper from './components/PageWrapper';
import FloatingQuickMenu from './components/FloatingQuickMenu';
import RouteScroller from './components/RouteScroller';
import './App.css';

import useAuthStore from './store/useAuthStore';
import cart from './utils/cart';
import useFavoritesStore from './store/useFavoritesStore';
import { useEffect, useState } from 'react';

function App() {
  // user and clearAuth are currently unused in this component; keep hooks if needed later
  const user = useAuthStore((s) => s.user);
  useAuthStore((s) => s.clearAuth);
  const [_, setCartCount] = useState(cart.getCount());
  
  // Favoritos
  const { loadFavorites, clearFavorites } = useFavoritesStore();

  useEffect(() => {
    const h = () => setCartCount(cart.getCount());
    window.addEventListener('cart:updated', h);
    return () => window.removeEventListener('cart:updated', h);
  }, []);

  // Cargar favoritos cuando el usuario se autentique
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      clearFavorites();
    }
  }, [user, loadFavorites, clearFavorites]);

  const handleLogin = () => {
    // Store already updated by Login component
  };
  
  return (
    <Router>
      <RouteScroller behavior="smooth" />
      <Header />
      <GlobalSnackbar />
      {/* Menú flotante global abajo a la derecha */}
      <FloatingQuickMenu
        whatsapp={import.meta.env.VITE_WHATSAPP_PHONE}
        instagram={import.meta.env.VITE_INSTAGRAM_HANDLE}
      />
      <Routes>
        {/* Rutas públicas principales */}
        <Route path="/login" element={<PageWrapper><Login onLogin={handleLogin} /></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPassword /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
        
        {/* Rutas con layout principal */}
        <Route path="/*" element={
          <Routes>
            {/* Vista principal pública - Sin contenedor para permitir carrusel full-width */}
            <Route path="/" element={<PageFade><HomeProducts /></PageFade>} />
            {/* Alias singular y plural para compatibilidad */}
            <Route path="/producto/:id" element={<PageWrapper><ProductDetail /></PageWrapper>} />
            <Route path="/productos/:id" element={<PageWrapper><ProductDetail /></PageWrapper>} />
            
            {/* Otras rutas con contenedor normal */}
            <Route path="/carrito" element={<PageWrapper><Cart /></PageWrapper>} />
            <Route path="/favoritos" element={<PageWrapper><ProtectedRoute><Favoritos /></ProtectedRoute></PageWrapper>} />
            <Route path="/acerca-de" element={<PageWrapper><AcercaDe /></PageWrapper>} />
            
            {/* Rutas protegidas para usuarios autenticados */}
            <Route path="/servicios" element={<PageWrapper><ProtectedRoute><ServiciosPostVenta /></ProtectedRoute></PageWrapper>} />
            
            {/* Vendedor: usar carrito como punto de venta (sin panel aparte) */}
            
            {/* Rutas administrativas - Solo para administradores */}
            <Route path="/usuarios" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><Usuarios /></ProtectedRoute></PageWrapper>} />
            <Route path="/productos" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><Productos /></ProtectedRoute></PageWrapper>} />
            <Route path="/pedidos" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><Pedidos /></ProtectedRoute></PageWrapper>} />
            <Route path="/pedidos/:id" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><PedidoDetail /></ProtectedRoute></PageWrapper>} />
            <Route path="/clientes" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><Clientes /></ProtectedRoute></PageWrapper>} />
            <Route path="/servicios-admin" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><ServiciosAdmin /></ProtectedRoute></PageWrapper>} />
            <Route path="/servicios-admin/:id" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><ServicioDetail /></ProtectedRoute></PageWrapper>} />
            <Route path="/empresa-admin" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><EmpresaAdmin /></ProtectedRoute></PageWrapper>} />
            <Route path="/pedidos-debug" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><PedidosDebug /></ProtectedRoute></PageWrapper>} />
            <Route path="/ventas-analytics" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><VentasAnalytics /></ProtectedRoute></PageWrapper>} />
            <Route path="/carousel-admin" element={<PageWrapper><ProtectedRoute requiredRoleId={3}><CarouselAdmin /></ProtectedRoute></PageWrapper>} />
            
            {/* Rutas especiales */}
            <Route path="/politicas-terminos" element={<PageWrapper><NotFound /></PageWrapper>} />
            <Route path="/404" element={<PageWrapper><NotFound /></PageWrapper>} />
            
            {/* Catch-all para páginas no encontradas */}
            <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
          </Routes>
        } />
      </Routes>
    </Router>
  );
}

export default App
