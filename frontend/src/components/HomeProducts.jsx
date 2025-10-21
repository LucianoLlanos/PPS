import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductModal from './ProductModal';
import ProductImageCarousel from './ProductImageCarousel';
import cart from '../utils/cart';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import '../stylos/HomeProducts.css';

export default function HomeProducts() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [selected, setSelected] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  
  // Estados para notificaciones toast
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  // Función para mostrar notificación toast
  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    // Ocultar después de 3 segundos
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const fetch = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/productos');
        setProductos(res.data || []);
      } catch (err) {
        // fallback
        res = await api.get('/seller/products');
        const normalized = (res.data || []).map(p => ({
          idProducto: p.id || p.idProducto,
          nombre: p.name || p.nombre,
          descripcion: p.description || p.descripcion,
          precio: p.price || p.precio,
          stock: p.stock || p.stockTotal,
          imagen: p.image || p.imagen,
        }));
        setProductos(normalized);
      }
    } catch (err) {
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setQuery(q);
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const filtered = productos.filter(p => {
    const text = (p.nombre || p.name || '').toString().toLowerCase() + ' ' + (p.descripcion || p.description || '').toString().toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page-1)*perPage, page*perPage);

  const exampleProducts = [
    { idProducto: 'e1', nombre: 'Ejemplo: Bomba 1HP', descripcion: 'Tarjeta de ejemplo - Bomba', precio: 45000, imagen: null },
    { idProducto: 'e2', nombre: 'Ejemplo: Panel Solar', descripcion: 'Tarjeta de ejemplo - Panel', precio: 85000, imagen: null },
    { idProducto: 'e3', nombre: 'Ejemplo: Tanque 1000L', descripcion: 'Tarjeta de ejemplo - Tanque', precio: 60000, imagen: null },
  ];

  const itemsToRender = showExamples ? exampleProducts : visible;

  const add = (p) => { 
    if (!user) {
      // Si no hay usuario logueado, redirigir a registro
      navigate('/register');
      return;
    }
    cart.addToCart(p, 1);
    // Mostrar notificación de éxito
    showToastNotification(`✅ ${p.nombre} agregado al carrito`);
  };

  const sampleProducts = [
    { idProducto: 's1', nombre: 'Ejemplo A', descripcion: 'Producto de ejemplo A', precio: 1000 },
    { idProducto: 's2', nombre: 'Ejemplo B', descripcion: 'Producto de ejemplo B', precio: 2000 },
    { idProducto: 's3', nombre: 'Ejemplo C', descripcion: 'Producto de ejemplo C', precio: 3000 },
  ];

  const loadExamples = () => { setProductos(sampleProducts); };

  if (loading) return <div className="products-loading">Cargando productos...</div>;
  if (error) return <div className="products-error alert alert-danger">{error}</div>;

  return (
    <div className="products-container">
      <div className="products-header">
        <h2 className="products-title">Catálogo de productos</h2>
        <div>
          <input placeholder="Buscar..." value={query} onChange={(e)=>{setQuery(e.target.value); setPage(1);}} className="products-search" />
        </div>
      </div>

      <div className="products-grid">
        {itemsToRender.map(p => (
          <div key={p.idProducto || p.id} className="product-card card">
            <ProductImageCarousel 
              imagenes={p.imagenes || (p.imagen ? [p.imagen] : [])} 
              nombre={p.nombre || p.name} 
            />
            <h5 className="product-title">{p.nombre}</h5>
            <div className="product-description">
              {(p.descripcion || '').length > 120 ? ((p.descripcion || '').slice(0,120) + '...') : (p.descripcion || '')}
            </div>
            <div className="product-footer">
              <div className="product-price">${Number(p.precio || 0).toFixed(2)}</div>
              <div>
                <button className="btn btn-sm btn-outline-primary product-view-btn" onClick={() => setSelected(p)}>Ver</button>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => add(p)}
                  title="Agregar al carrito"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}

        {itemsToRender.length === 0 && (
          <div className="products-empty">No hay productos para mostrar</div>
        )}
      </div>

      <div className="products-toggle-section">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowExamples(s => !s)}>
          {showExamples ? 'Mostrar reales' : 'Mostrar ejemplos'}
        </button>
      </div>

      {/* Paginación simple */}
      <div className="products-pagination">
        <button disabled={page<=1} onClick={()=>setPage(page-1)}>Anterior</button>
        <div className="pagination-info">Página {page} / {totalPages}</div>
        <button disabled={page>=totalPages} onClick={()=>setPage(page+1)}>Siguiente</button>
      </div>

      {selected && <ProductModal 
        product={selected} 
        onClose={()=>setSelected(null)} 
        onAdded={(productName) => {
          showToastNotification(`✅ ${productName} agregado al carrito`);
        }} 
      />}
      
      {/* Notificación Toast */}
      {showToast && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#28a745',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            animation: 'slideInRight 0.3s ease-out',
            maxWidth: '300px'
          }}
        >
          <i className="bi bi-check-circle-fill"></i>
          {toastMessage}
        </div>
      )}

      {/* CSS para animación del toast */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
