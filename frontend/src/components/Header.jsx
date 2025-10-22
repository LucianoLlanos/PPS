import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { getCount, clearUserCart } from '../utils/cart';
import '../stylos/Header.css';

export default function Header({ initialQuery }) {
  const [q, setQ] = useState(initialQuery || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const timer = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    // Cargar contador inicial del carrito
    setCartCount(getCount());

    // Escuchar cambios en el carrito
    const handleCartUpdate = (e) => {
      setCartCount(e.detail.count);
    };

    window.addEventListener('cart:updated', handleCartUpdate);
    return () => window.removeEventListener('cart:updated', handleCartUpdate);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(q || '')}`);
  };

  const fetchSuggestions = async (text) => {
    if (!text || text.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await api.get('/productos');
      const items = (res.data || []).map(p => p.nombre || p.name || '');
      const filtered = items.filter(n => n.toLowerCase().includes(text.toLowerCase())).slice(0,8);
      setSuggestions(filtered);
      setShowSug(true);
    } catch (e) {
      setSuggestions([]);
      setShowSug(false);
    }
  };

  const handleChange = (val) => {
    setQ(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const pickSuggestion = (s) => {
    setQ(s);
    setShowSug(false);
    navigate(`/?q=${encodeURIComponent(s)}`);
  };

  return (
    <header className="header-container mb-4">
      <nav className="navbar navbar-expand-lg navbar-light header-navbar">
        <div className="container-fluid">
          <Link className="navbar-brand header-brand" to="/">Atilio Marola</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">Catálogo</Link>
              </li>
              
              {/* Enlace de servicios para usuarios regulares (no admin) */}
              {user && Number(user.idRol) !== 3 && (
                <li className="nav-item">
                  <Link className="nav-link" to="/servicios">
                    <i className="bi bi-tools me-1"></i>
                    Servicios
                  </Link>
                </li>
              )}
              
              {/* Enlaces de administración visibles sólo para admin (idRol === 3) */}
              {user && Number(user.idRol) === 3 && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/productos">Productos</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/usuarios">Usuarios</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/pedidos">Pedidos</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/clientes">Clientes</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/servicios-admin">
                      <i className="bi bi-tools me-1"></i>
                      Gestión Servicios
                    </Link>
                  </li>
                </>
              )}
              
              {/* Mostrar Login y Registro sólo si NO hay usuario logueado */}
              {!user && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">Registro</Link>
                  </li>
                </>
              )}
            </ul>
            <div className="d-flex align-items-center gap-3">
              {/* Botón del carrito */}
              <div className="d-flex align-items-center">
                <button 
                  className="btn btn-outline-primary position-relative"
                  onClick={() => navigate('/carrito')}
                  title="Ver carrito"
                >
                  <i className="bi bi-cart3"></i>
                  {cartCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {cartCount}
                      <span className="visually-hidden">productos en carrito</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Buscador */}
              <form className="d-flex position-relative header-search-form" onSubmit={submit}>
                <div className="header-search-container">
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-search"/></span>
                    <input className="form-control" type="search" placeholder="Buscar..." aria-label="Buscar" value={q} onChange={(e)=>handleChange(e.target.value)} onFocus={()=>{ if (suggestions.length>0) setShowSug(true); }} />
                    <button className="btn btn-outline-success" type="submit"><i className="bi bi-arrow-right-circle"/></button>
                  </div>
                  {showSug && suggestions && suggestions.length>0 && (
                    <ul className="list-group position-absolute header-suggestions">
                      {suggestions.map((s,idx)=> (
                        <li key={idx} className="list-group-item list-group-item-action header-suggestion-item" onMouseDown={()=>pickSuggestion(s)}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </form>

              {/* Mostrar nombre y logout cuando hay usuario */}
              {user && (
                <div className="d-flex align-items-center">
                  <span className="me-2 text-nowrap">{user.nombre} {user.apellido}</span>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => { 
                    clearUserCart(); // Limpiar carrito del usuario
                    clearAuth(); 
                    navigate('/'); 
                  }}>Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
