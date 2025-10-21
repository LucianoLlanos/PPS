import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { migrateGuestCart, migrateOldCart } from '../utils/cart';
import '../stylos/Register.css';

// Definir el estilo del spinner
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (formData.telefono && !/^\+?[\d\s-()]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Ingresa un teléfono válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        telefono: formData.telefono.trim() || null,
        idRol: 1 // Cliente por defecto
      };
      
      const res = await api.post('/auth/register', payload);
      
      // Después del registro exitoso, hacer login automático
      const loginRes = await api.post('/auth/login', { 
        email: payload.email, 
        password: payload.password 
      });
      
      const { token, user } = loginRes.data;
      setAuth(user, token);
      
      // Migrar carrito de invitado a usuario logueado
      migrateGuestCart(user);
      // Migrar carrito de versión anterior si existe
      migrateOldCart();
      
      // Redirigir al catálogo principal
      navigate('/');
      
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Error al crear cuenta';
      
      if (message.includes('Email ya registrado')) {
        setErrors({ email: 'Este email ya está registrado' });
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{spinnerStyle}</style>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #4A90E2 0%, #357ABD 50%, #1E3A8A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '50px 40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center'
        }}>
          {/* Avatar */}
          <div className="mb-4">
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '3px solid rgba(255,255,255,0.8)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <i className="bi bi-person-plus-fill" style={{ fontSize: '32px', color: '#9CA3AF' }}></i>
            </div>
          </div>
          
          <div style={{
            fontSize: '24px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '30px'
          }}>
            Crear cuenta
          </div>
          
        <form onSubmit={submit}>
          {/* Nombre field */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
              border: errors.nombre ? '1px solid #dc3545' : '1px solid rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}>
              <i className="bi bi-person" style={{ 
                fontSize: '16px', 
                color: '#9CA3AF', 
                marginLeft: '12px',
                marginRight: '8px'
              }}></i>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre *"
                required
                style={{
                  flex: 1,
                  padding: '14px 12px 14px 0',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '15px',
                  outline: 'none',
                  color: '#374151'
                }}
              />
            </div>
            {errors.nombre && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.nombre}</div>}
          </div>

          {/* Apellido field */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
              border: errors.apellido ? '1px solid #dc3545' : '1px solid rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}>
              <i className="bi bi-person" style={{ 
                fontSize: '16px', 
                color: '#9CA3AF', 
                marginLeft: '12px',
                marginRight: '8px'
              }}></i>
              <input
                id="apellido"
                name="apellido"
                type="text"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Apellido *"
                required
                style={{
                  flex: 1,
                  padding: '14px 12px 14px 0',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '15px',
                  outline: 'none',
                  color: '#374151'
                }}
              />
            </div>
            {errors.apellido && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.apellido}</div>}
          </div>

          {/* Email field */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
              border: errors.email ? '1px solid #dc3545' : '1px solid rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}>
              <i className="bi bi-envelope" style={{ 
                fontSize: '16px', 
                color: '#9CA3AF', 
                marginLeft: '12px',
                marginRight: '8px'
              }}></i>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email *"
                required
                style={{
                  flex: 1,
                  padding: '14px 12px 14px 0',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '15px',
                  outline: 'none',
                  color: '#374151'
                }}
              />
            </div>
            {errors.email && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.email}</div>}
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
              border: errors.password ? '1px solid #dc3545' : '1px solid rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}>
              <i className="bi bi-lock" style={{ 
                fontSize: '16px', 
                color: '#9CA3AF', 
                marginLeft: '12px',
                marginRight: '8px'
              }}></i>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Contraseña * (mínimo 6 caracteres)"
                required
                style={{
                  flex: 1,
                  padding: '14px 12px 14px 0',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '15px',
                  outline: 'none',
                  color: '#374151'
                }}
              />
            </div>
            {errors.password && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.password}</div>}
          </div>

          {/* Telefono field */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
              border: errors.telefono ? '1px solid #dc3545' : '1px solid rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}>
              <i className="bi bi-telephone" style={{ 
                fontSize: '16px', 
                color: '#9CA3AF', 
                marginLeft: '12px',
                marginRight: '8px'
              }}></i>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Teléfono (opcional)"
                style={{
                  flex: 1,
                  padding: '14px 12px 14px 0',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '15px',
                  outline: 'none',
                  color: '#374151'
                }}
              />
            </div>
            {errors.telefono && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{errors.telefono}</div>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              background: '#374151',
              color: 'white',
              fontSize: '15px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              transition: 'all 0.2s ease',
              marginBottom: '20px',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#1F2937')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#374151')}
          >
            {loading ? (
              <>
                <span style={{ 
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></span>
                CREATING ACCOUNT...
              </>
            ) : (
              'CREATE ACCOUNT'
            )}
          </button>
        </form>

          <div style={{ 
            paddingTop: '15px',
            marginTop: '10px'
          }}>
            <p style={{ 
              margin: 0, 
              color: '#9CA3AF',
              fontSize: '13px'
            }}>
              ¿Ya tienes cuenta?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#4A90E2',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}