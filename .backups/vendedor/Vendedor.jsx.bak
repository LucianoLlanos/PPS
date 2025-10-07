import React, { useState } from 'react';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import OrderList from './OrderList';
import CarouselManager from './CarouselManager';

export default function Vendedor() {
  const [view, setView] = useState('products');
  const [editingProduct, setEditingProduct] = useState(null);

  const handleSaved = () => {
    // loose coupling: dispatch a custom event so list can refresh or use a global state later
    window.dispatchEvent(new Event('product:saved'));
  };

  const clearEditing = () => setEditingProduct(null);

  return (
    <div style={{ padding: 20 }}>
      <h2>Panel Vendedor</h2>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setView('products')}>Productos</button>
        <button onClick={() => setView('orders')} style={{ marginLeft: 8 }}>Pedidos</button>
        <button onClick={() => setView('carousel')} style={{ marginLeft: 8 }}>Carrusel</button>
      </div>

      {view === 'products' && (
        <div>
          <ProductForm editingProduct={editingProduct} onSaved={handleSaved} clearEditing={clearEditing} />
          <ProductList onEdit={(p) => setEditingProduct(p)} />
        </div>
      )}

      {view === 'orders' && <OrderList />}

      {view === 'carousel' && <CarouselManager />}
    </div>
  );
}
