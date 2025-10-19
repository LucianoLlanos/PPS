import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { migrateGuestCart, migrateOldCart } from '../utils/cart';
import '../stylos/Login.css';
import '../stylos/Notifications.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  const setAuth = useAuthStore((s) => s.setAuth);

  const handleDemoAdmin = async () => {
    setEmail('admin@example.com');
    setPassword('admin123');
    
    const fakeEvent = {
      preventDefault: () => {}
    };
    
    await submit(fakeEvent);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { email, password };
      const res = await api.post('/auth/login', payload);
      const { token, user } = res.data;
      setAuth(user, token);
      
      // Migrar carrito de invitado a usuario logueado
      migrateGuestCart(user);
      // Migrar carrito de versión anterior si existe
      migrateOldCart();
      
      // Mostrar mensaje de bienvenida personalizado
      setWelcomeUser(user);
      setShowWelcome(true);
      setLoading(false);
      setCountdown(3);
      
      // Contador regresivo
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowWelcome(false);
            // Si es admin (idRol === 3) llevar a vista de productos (CRUD)
            if (user && Number(user.idRol) === 3) navigate('/productos');
            else navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Error en login';
      alert(message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Avatar */}
        <div className="mb-4">
          <div className="login-avatar">
            <i className="bi bi-person-fill"></i>
          </div>
        </div>

        {/* Botón demo admin más sutil */}
        <div className="demo-admin-section">
          <button 
            type="button" 
            onClick={handleDemoAdmin}
            disabled={loading}
            className="demo-admin-btn"
          >
            Demo Admin
          </button>
        </div>

        <form onSubmit={submit}>
          {/* Username field */}
          <div className="login-input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />
          </div>

          {/* Password field */}
          <div className="login-input-group">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
          </div>

          {/* Remember me checkbox */}
          <div className="login-remember-section">
            <label className="login-checkbox-label">
              <input 
                type="checkbox" 
                className="login-checkbox"
              />
              Remember me
            </label>
            <a href="#" className="login-forgot-link">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-submit-btn"
            onMouseEnter={(e) => !loading && (e.target.style.background = '#1F2937')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#374151')}
          >
            {loading ? 'SIGNING IN...' : 'LOGIN'}
          </button>
        </form>

        <div className="login-register-section">
          <p className="login-register-text">
            ¿No tienes cuenta?{' '}
            <Link 
              to="/register" 
              className="login-register-link"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>

      {/* Mensaje de Bienvenida */}
      {showWelcome && welcomeUser && (
        <div className="welcome-message-overlay">
          <div className="welcome-message-modal">
            {/* Icono de éxito */}
            <div className="welcome-message-icon">
              <i className="bi bi-check-lg"></i>
            </div>

            {/* Mensaje personalizado */}
            <h2 style={{
              color: '#1F2937',
              fontSize: '24px',
              fontWeight: '700',
              margin: '0 0 15px 0',
              letterSpacing: '-0.5px'
            }}>
              ¡Hola, {welcomeUser.nombre} {welcomeUser.apellido}! 👋
            </h2>

            <p className="welcome-role-badge">
              {welcomeUser.idRol === 3 ? '👑 ADMINISTRADOR' : '🛍️ CLIENTE'}
            </p>

            <p className="welcome-message-text">
              {welcomeUser.idRol === 3 
                ? `Bienvenido de vuelta al panel de administración. Tendrás acceso completo a la gestión de productos, usuarios y pedidos.`
                : `¡Nos alegra verte de nuevo! Explora nuestros productos y servicios post-venta disponibles.`
              }
            </p>

            <p className="welcome-countdown">
              Redirigiendo en {countdown} segundo{countdown !== 1 ? 's' : ''}...
            </p>

            {/* Barra de progreso */}
            <div className="welcome-progress-container">
              <div className="welcome-progress-bar"></div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
