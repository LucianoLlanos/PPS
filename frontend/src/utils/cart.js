const CART_KEY_PREFIX = 'app_cart_v2_user_';

// Función para obtener el usuario actual desde el store de auth
function getCurrentUser() {
  try {
    // Leer directamente del localStorage. soportar dos formatos:
    // 1) la key 'user' (nuevo store useAuthStore)
    // 2) la key 'auth-store' (posible formato anterior)
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try { return JSON.parse(rawUser); } catch { return null; }
    }
    const authData = localStorage.getItem('auth-store');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.state?.user || null;
      } catch { return null; }
    }
    return null;
  } catch { /* ignore */
    return null;
  }
}

function getUserCartKey() {
  const user = getCurrentUser();
  const id = user && (user.idUsuario || user.id || user.idUser || user.userId);
  if (!user || !id) {
    // Si no hay usuario logueado, usar carrito temporal
    return CART_KEY_PREFIX + 'guest';
  }
  return CART_KEY_PREFIX + id;
}

function read() {
  try {
    const cartKey = getUserCartKey();
    const raw = localStorage.getItem(cartKey);
    return raw ? JSON.parse(raw) : [];
  } catch { /* ignore */
    return [];
  }
}

function write(arr) {
  const cartKey = getUserCartKey();
  localStorage.setItem(cartKey, JSON.stringify(arr));
}

export function getCart() {
  const cart = read();
  // Limpiar productos con datos inválidos
  const cleanCart = cart.filter(item => {
    if (!item.product || !item.id) return false;
    // Normalizar precio si es necesario
    if (item.product.precio !== undefined) {
      item.product.precio = parseFloat(item.product.precio || 0);
    }
    if (item.product.price !== undefined) {
      item.product.price = parseFloat(item.product.price || 0);
    }
    return true;
  });
  
  // Si se limpiaron productos, actualizar el localStorage
  if (cleanCart.length !== cart.length) {
    write(cleanCart);
  }
  
  return cleanCart;
}

export function getCount() {
  const c = read();
  return c.reduce((s, it) => s + (it.quantity || 1), 0);
}

export function addToCart(product, qty = 1) {
  // prevent admins from adding to cart
  try {
    const user = getCurrentUser();
    if (user && Number(user.idRol) === 3) {
      // dispatch an event so UI can notify the user
      window.dispatchEvent(new CustomEvent('cart:forbidden', { detail: { message: 'Administradores no pueden agregar al carrito' } }));
      return null;
    }
  } catch { /* ignore */ }
  // Normalizar el producto para asegurar que el precio sea un número
  const normalizedProduct = {
    ...product,
    precio: parseFloat(product.precio || product.price || 0),
    price: parseFloat(product.price || product.precio || 0)
  };
  
  const arr = read();
  const id = normalizedProduct.idProducto || normalizedProduct.id;
  const idx = arr.findIndex(i => i.id === id);
  if (idx >= 0) {
    arr[idx].quantity = (arr[idx].quantity || 1) + parseInt(qty, 10);
  } else {
    arr.push({ id, product: normalizedProduct, quantity: parseInt(qty, 10) });
  }
  write(arr);
  // dispatch event so UI can react
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: getCount() } }));
  return arr;
}

export function removeFromCart(id) {
  const arr = read().filter(i => i.id !== id);
  write(arr);
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: getCount() } }));
  return arr;
}

export function updateQuantity(id, newQuantity) {
  const arr = read();
  const idx = arr.findIndex(i => i.id === id);
  if (idx >= 0) {
    const qty = parseInt(newQuantity, 10);
    if (qty <= 0) {
      // Si la cantidad es 0 o menor, eliminar el producto
      arr.splice(idx, 1);
    } else {
      arr[idx].quantity = qty;
    }
    write(arr);
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: getCount() } }));
  }
  return arr;
}

export function getTotal() {
  const cart = read();
  return cart.reduce((total, item) => {
    const price = parseFloat(item.product.price || item.product.precio || 0);
    const quantity = parseInt(item.quantity || 1, 10);
    return total + (price * quantity);
  }, 0);
}

export function getSubtotal(item) {
  const price = parseFloat(item.product.price || item.product.precio || 0);
  const quantity = parseInt(item.quantity || 1, 10);
  return price * quantity;
}

export function clearCart() {
  write([]);
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: 0 } }));
}

export function resetCart() {
  const cartKey = getUserCartKey();
  localStorage.removeItem(cartKey);
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: 0 } }));
}

// Migrar carrito de invitado a usuario logueado
export function migrateGuestCart(user) {
  if (!user || !user.idUsuario) return;
  
  const guestCartKey = CART_KEY_PREFIX + 'guest';
  const userCartKey = CART_KEY_PREFIX + user.idUsuario;
  
  try {
    const guestCart = localStorage.getItem(guestCartKey);
    if (guestCart) {
      const existingUserCart = localStorage.getItem(userCartKey);
      
      if (!existingUserCart) {
        // Si el usuario no tiene carrito, migrar el de invitado
        localStorage.setItem(userCartKey, guestCart);
      } else {
        // Si ya tiene carrito, combinar ambos
        const guestItems = JSON.parse(guestCart);
        const userItems = JSON.parse(existingUserCart);
        const combined = [...userItems];
        
        guestItems.forEach(guestItem => {
          const existingIdx = combined.findIndex(item => item.id === guestItem.id);
          if (existingIdx >= 0) {
            // Si el producto ya existe, sumar las cantidades
            combined[existingIdx].quantity += guestItem.quantity;
          } else {
            // Si no existe, añadirlo
            combined.push(guestItem);
          }
        });
        
        localStorage.setItem(userCartKey, JSON.stringify(combined));
      }
      
      // Limpiar carrito de invitado
      localStorage.removeItem(guestCartKey);
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: getCount() } }));
    }
  } catch { /* ignore */
    // Error silencioso al migrar carrito
  }
}

// Limpiar carrito del usuario actual al cerrar sesión
export function clearUserCart() {
  const user = getCurrentUser();
  // remove both user-specific cart and guest cart to ensure no leftover items
  try {
    if (user) {
      const id = user.idUsuario || user.id || user.idUser || user.userId;
      if (id) {
        const userCartKey = CART_KEY_PREFIX + id;
        localStorage.removeItem(userCartKey);
      }
    }
    // always remove guest cart as well
    localStorage.removeItem(CART_KEY_PREFIX + 'guest');
  } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: 0 } }));
}

// Obtener información del usuario para debug
// Migrar carrito de la versión anterior (v1) a la nueva (v2)
export function migrateOldCart() {
  const OLD_CART_KEY = 'app_cart_v1';
  const user = getCurrentUser();
  
  try {
    const oldCart = localStorage.getItem(OLD_CART_KEY);
    if (oldCart && user && user.idUsuario) {
      const userCartKey = CART_KEY_PREFIX + user.idUsuario;
      const existingCart = localStorage.getItem(userCartKey);
      
      if (!existingCart) {
        // Si no existe carrito del usuario, migrar el viejo
        localStorage.setItem(userCartKey, oldCart);
      }
      
      // Limpiar carrito viejo
      localStorage.removeItem(OLD_CART_KEY);
    }
  } catch { /* ignore */
    // Error silencioso al migrar carrito v1
  }
}

export function getCartInfo() {
  const user = getCurrentUser();
  const cartKey = getUserCartKey();
  const cartItems = getCart();
  
  return {
    user: user,
    cartKey: cartKey,
    itemCount: cartItems.length,
    totalItems: getCount()
  };
}

export default { getCart, addToCart, removeFromCart, clearCart, getCount, migrateGuestCart, clearUserCart, migrateOldCart };
