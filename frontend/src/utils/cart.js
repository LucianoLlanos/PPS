const CART_KEY = 'app_cart_v1';

function read() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function write(arr) {
  localStorage.setItem(CART_KEY, JSON.stringify(arr));
}

export function getCart() {
  return read();
}

export function getCount() {
  const c = read();
  return c.reduce((s, it) => s + (it.quantity || 1), 0);
}

export function addToCart(product, qty = 1) {
  const arr = read();
  const id = product.idProducto || product.id;
  const idx = arr.findIndex(i => i.id === id);
  if (idx >= 0) {
    arr[idx].quantity = (arr[idx].quantity || 1) + qty;
  } else {
    arr.push({ id, product, quantity: qty });
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

export function clearCart() {
  write([]);
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: 0 } }));
}

export default { getCart, addToCart, removeFromCart, clearCart, getCount };
