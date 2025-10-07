import React from 'react';
import cart from '../utils/cart';
import api from '../api/axios';

export default function ProductModal({ product, onClose, onAdded }) {
  if (!product) return null;

  const title = product.nombre || product.name;
  const desc = product.descripcion || product.description || '';
  const price = Number(product.precio || product.price || 0);
  const img = product.imagen || product.image;

  const handleAdd = () => {
    cart.addToCart(product, 1);
    if (onAdded) onAdded();
    alert('Producto añadido al carrito');
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
                // Para pruebas: usar siempre la misma imagen local
                const src = '/img/descarga.jpg';
                return <img src={src} alt={title} style={{maxWidth:'100%', maxHeight:360}} />;
              })()}
            </div>
            <div style={{flex: 1}}>
              <p style={{whiteSpace:'pre-wrap'}}>{desc}</p>
              <div style={{fontWeight:700, fontSize:18}}>${price.toFixed(2)}</div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            <button className="btn btn-primary" onClick={handleAdd}>Agregar al carrito</button>
          </div>
        </div>
      </div>
    </div>
  );
}
