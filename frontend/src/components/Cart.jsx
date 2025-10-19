import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateQuantity, removeFromCart, clearCart, getTotal, getSubtotal } from '../utils/cart';
import useAuthStore from '../store/useAuthStore';
import '../stylos/Cart.css';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    loadCart();
    
    // Escuchar cambios en el carrito
    const handleCartUpdate = () => {
      loadCart();
    };
    
    window.addEventListener('cart:updated', handleCartUpdate);
    return () => window.removeEventListener('cart:updated', handleCartUpdate);
  }, []);

  const loadCart = () => {
    try {
      const items = getCart();
      setCartItems(items);
    } catch (error) {
      setCartItems([]);
    }
  };

  const handleQuantityChange = (id, newQuantity) => {
    updateQuantity(id, newQuantity);
    loadCart();
  };

  const handleRemoveItem = (id) => {
    removeFromCart(id);
    loadCart();
  };

  const handleClearCart = () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      clearCart();
      loadCart();
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (cartItems.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    alert('Funcionalidad de checkout pendiente de implementar');
  };

  const total = getTotal();
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="cart-empty">
              <i className="bi bi-cart-x cart-empty-icon"></i>
              <h3 className="cart-empty-title">Tu carrito está vacío</h3>
              <p className="cart-empty-text">Agrega algunos productos para comenzar</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/')}
              >
                Ver productos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2 className="cart-title">
          <i className="bi bi-cart3"></i>
          Mi Carrito
        </h2>
        <p className="cart-subtitle">
          {itemCount} {itemCount === 1 ? 'producto' : 'productos'} en tu carrito
        </p>
      </div>

      <div className="row">
        <div className="col-12">
          {/* Tabla de productos */}
          <div className="card mb-4">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="px-4 py-3">Producto</th>
                      <th scope="col" className="text-center py-3">Precio Unitario</th>
                      <th scope="col" className="text-center py-3">Cantidad</th>
                      <th scope="col" className="text-center py-3">Subtotal</th>
                      <th scope="col" className="text-center py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.filter(item => item && item.product).map((item) => {
                      // Validar que el item tenga la estructura correcta
                      if (!item || !item.product) {
                        return null;
                      }
                      
                      const product = item.product;
                      const subtotal = getSubtotal(item);
                      const unitPrice = parseFloat(product.price || product.precio || 0);
                      const imageUrl = product.imagen ? `/uploads/${product.imagen}` : '/img/no-image.jpg';

                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center">
                              <img 
                                src={imageUrl} 
                                alt={product.nombre}
                                className="cart-product-image rounded me-3"
                                onError={(e) => { e.target.src = '/img/no-image.jpg'; }}
                              />
                              <div>
                                <h6 className="mb-1">{product.nombre}</h6>
                                <small className="text-muted">{product.categoria || 'Sin categoría'}</small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-3 align-middle">
                            <div className="fw-bold">${unitPrice.toFixed(2)}</div>
                          </td>
                          <td className="text-center py-3 align-middle">
                            <div className="d-flex justify-content-center align-items-center">
                              <div className="input-group cart-quantity-group">
                                <button 
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <i className="bi bi-dash"></i>
                                </button>
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-center cart-quantity-input"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                    handleQuantityChange(item.id, newQty);
                                  }}
                                  min="1"
                                />
                                <button 
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                >
                                  <i className="bi bi-plus"></i>
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-3 align-middle">
                            <div className="fw-bold text-primary">${subtotal.toFixed(2)}</div>
                          </td>
                          <td className="text-center py-3 align-middle">
                            <div className="d-flex justify-content-center gap-2">
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => {
                                  const newQty = prompt('Nueva cantidad:', item.quantity);
                                  if (newQty && parseInt(newQty) > 0) {
                                    handleQuantityChange(item.id, parseInt(newQty));
                                  }
                                }}
                                title="Editar cantidad"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => {
                                  if (window.confirm(`¿Eliminar ${product.nombre} del carrito?`)) {
                                    handleRemoveItem(item.id);
                                  }
                                }}
                                title="Eliminar producto"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Resumen y botones de acción */}
          <div className="row">
            <div className="col-md-8">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigate('/')}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Seguir comprando
              </button>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <i className="bi bi-receipt me-2"></i>
                    Resumen del pedido
                  </h5>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span>Productos ({itemCount}):</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span>Envío:</span>
                    <span className="text-success">Gratis</span>
                  </div>
                  
                  <hr />
                  
                  <div className="d-flex justify-content-between mb-3">
                    <strong>Total:</strong>
                    <strong className="text-primary fs-5">${total.toFixed(2)}</strong>
                  </div>

                  {!user && (
                    <div className="alert alert-warning" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <small>Necesitas iniciar sesión para realizar el pedido</small>
                    </div>
                  )}

                  <button 
                    className={`btn ${user ? 'btn-success' : 'btn-outline-primary'} w-100 btn-lg`}
                    onClick={handleCheckout}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-bag-check me-2"></i>
                        {user ? 'Hacer Pedido' : 'Iniciar sesión para pedir'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}