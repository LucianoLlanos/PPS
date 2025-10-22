import React from 'react';
import { useNavigate } from 'react-router-dom';
import cart from '../utils/cart';
import useAuthStore from '../store/useAuthStore';

export default function ProductModal({ product, onClose, onAdded }) {
  if (!product) return null;

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const title = product.nombre || product.name;
  const desc = product.descripcion || product.description || '';
  const price = Number(product.precio || product.price || 0);
  const img = product.imagen || product.image;

  const handleAdd = () => {
    if (!user) {
      onClose(); // Cerrar modal primero
      // Notificar que debe iniciar sesión
      if (onAdded) onAdded(`⚠️ Inicia sesión para agregar productos al carrito`, 'warning');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }
    cart.addToCart(product, 1);
    if (onAdded) onAdded(`✅ ${title} agregado al carrito`, 'success'); // Pasar mensaje completo y tipo
    onClose(); // Cerrar el modal después de agregar
  };

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog" style={{background: 'rgba(0,0,0,0.4)'}} onClick={onClose}>
      <div className="modal-dialog modal-lg" role="document" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body d-flex gap-3">
            <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {(() => {
                // Usar imagen del producto si existe, sino usar imagen por defecto
                const imagenProducto = product.imagen || product.image;
                const src = imagenProducto 
                  ? `http://localhost:3000/uploads/${imagenProducto}`
                  : '/img/descarga.jpg';
                return (
                  <img 
                    src={src} 
                    alt={title} 
                    style={{maxWidth:'100%', maxHeight:360, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}
                    onError={(e) => {
                      // Si la imagen del producto falla, usar la imagen por defecto
                      e.target.src = '/img/descarga.jpg';
                    }}
                  />
                );
              })()}
            </div>
            <div style={{flex: 1}}>
              <p style={{whiteSpace:'pre-wrap'}}>{desc}</p>
              <div style={{fontWeight:700, fontSize:18}}>${price.toFixed(2)}</div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            <button 
              className="btn btn-primary"
              onClick={handleAdd}
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
