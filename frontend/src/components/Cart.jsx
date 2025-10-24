import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateQuantity, removeFromCart, clearCart, getTotal, getSubtotal } from '../utils/cart';
import { formatCurrency, formatNumber } from '../utils/format';
import useAuthStore from '../store/useAuthStore';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Button, Card, CardContent, Grid, Avatar, Stack, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    loadCart();
    const handleCartUpdate = () => loadCart();
    window.addEventListener('cart:updated', handleCartUpdate);
    return () => window.removeEventListener('cart:updated', handleCartUpdate);
  }, []);

  const loadCart = () => {
    try {
      const items = getCart();
      setCartItems(items || []);
    } catch {
      setCartItems([]);
    }
  };

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) return;
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
    if (!user) { navigate('/login'); return; }
    if (cartItems.length === 0) { alert('El carrito está vacío'); return; }
    alert('Funcionalidad de checkout pendiente de implementar');
  };

  const total = getTotal();
  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  if (!cartItems || cartItems.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Stack spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary' }}>🛒</Avatar>
          <Typography variant="h6">Tu carrito está vacío</Typography>
          <Typography color="text.secondary">Agrega algunos productos para comenzar</Typography>
          <Button variant="contained" onClick={() => navigate('/')}>Ver productos</Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Mi Carrito</Typography>
  <Typography color="text.secondary">{formatNumber(itemCount)} {itemCount === 1 ? 'producto' : 'productos'}</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="center">Precio</TableCell>
                  <TableCell align="center">Cantidad</TableCell>
                  <TableCell align="center">Subtotal</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.filter(item => item && item.product).map(item => {
                  const product = item.product;
                  const subtotal = getSubtotal(item);
                  const unitPrice = parseFloat(product.price || product.precio || 0);
                  const resolveImage = (prod) => {
                    // prod.imagenes may be an array of filenames
                    if (!prod) return '/img/no-image.jpg';
                    if (prod.imagenes && Array.isArray(prod.imagenes) && prod.imagenes.length > 0) return `http://localhost:3000/uploads/${prod.imagenes[0]}`;
                    if (prod.imagen && typeof prod.imagen === 'string' && prod.imagen.trim()) {
                      // sometimes imagen can be a comma separated list
                      const val = prod.imagen.includes(',') ? prod.imagen.split(',')[0].trim() : prod.imagen.trim();
                      // if it's already a data url, return as is
                      if (val.startsWith('data:')) return val;
                      return `http://localhost:3000/uploads/${val}`;
                    }
                    if (prod.image && typeof prod.image === 'string' && prod.image.trim()) return `http://localhost:3000/uploads/${prod.image.trim()}`;
                    return '/img/no-image.jpg';
                  };
                  const imageUrl = resolveImage(product);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <img src={imageUrl} alt={product.nombre} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} onError={(e)=> e.target.src = '/img/no-image.jpg'} />
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>{product.nombre}</Typography>
                            <Typography variant="caption" color="text.secondary">{product.categoria || 'Sin categoría'}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{formatCurrency(unitPrice)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <IconButton size="small" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><RemoveIcon /></IconButton>
                          <TextField value={item.quantity} size="small" inputProps={{ style: { textAlign: 'center', width: 64 } }} onChange={(e) => { const q = Math.max(1, parseInt(e.target.value) || 1); handleQuantityChange(item.id, q); }} />
                          <IconButton size="small" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}><AddIcon /></IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{formatCurrency(subtotal)}</TableCell>
                      <TableCell align="center">
                        <IconButton color="error" onClick={() => { if (window.confirm(`¿Eliminar ${product.nombre} del carrito?`)) handleRemoveItem(item.id); }}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Resumen del pedido</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Productos ({itemCount})</Typography>
                <Typography>{formatCurrency(total)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Envío</Typography>
                <Typography color="success.main">Gratis</Typography>
              </Box>
              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">{formatCurrency(total)}</Typography>
              </Box>

              {!user && (
                <Alert severity="warning" sx={{ mt: 2 }}>Necesitas iniciar sesión para realizar el pedido</Alert>
              )}

              <Stack spacing={1} sx={{ mt: 3 }}>
                <Button variant={user ? 'contained' : 'outlined'} color={user ? 'success' : 'primary'} fullWidth onClick={handleCheckout} disabled={loading}>{loading ? 'Procesando...' : (user ? 'Hacer Pedido' : 'Iniciar sesión para pedir')}</Button>
                <Button variant="outlined" fullWidth onClick={() => navigate('/')}>Seguir comprando</Button>
                <Button variant="text" fullWidth color="error" onClick={handleClearCart}>Vaciar carrito</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}