import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';

export default function Header({ initialQuery }) {
  const [q, setQ] = useState(initialQuery || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const timer = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

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
    <header className="mb-4">
      <nav className="navbar navbar-expand-lg navbar-light bg-light rounded fixed-top shadow-sm">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">Mi Tienda</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">Catálogo</Link>
              </li>
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
                </>
              )}
              {/* Mostrar Login sólo si NO hay usuario logueado */}
              {!user && (
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
              )}
            </ul>
            {/* Mostrar nombre y logout cuando hay usuario */}
            {user && (
              <div className="d-flex align-items-center ms-3">
                <span className="me-2">{user.nombre} {user.apellido}</span>
                <button className="btn btn-outline-danger btn-sm" onClick={() => { clearAuth(); navigate('/'); }}>Cerrar sesión</button>
              </div>
            )}
            <form className="d-flex position-relative" onSubmit={submit} style={{minWidth:320}}>
              <div style={{width:'100%', position:'relative'}}>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-search"/></span>
                  <input className="form-control" type="search" placeholder="Buscar..." aria-label="Buscar" value={q} onChange={(e)=>handleChange(e.target.value)} onFocus={()=>{ if (suggestions.length>0) setShowSug(true); }} />
                  <button className="btn btn-outline-success" type="submit"><i className="bi bi-arrow-right-circle"/></button>
                </div>
                {showSug && suggestions && suggestions.length>0 && (
                  <ul className="list-group position-absolute" style={{zIndex:2000, width:'100%'}}>
                    {suggestions.map((s,idx)=> (
                      <li key={idx} className="list-group-item list-group-item-action" style={{cursor:'pointer'}} onMouseDown={()=>pickSuggestion(s)}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            </form>
          </div>
        </div>
      </nav>
    </header>
  );
}
