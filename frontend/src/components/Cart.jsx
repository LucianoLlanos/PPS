import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateQuantity, removeFromCart, clearCart, getTotal, getSubtotal } from '../utils/cart';
import { formatCurrency, formatNumber } from '../utils/format';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Button, Card, CardContent, Grid, Avatar, Stack, Alert, Divider, FormControl, InputLabel, Select, MenuItem, Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Datos para flujo de vendedor
  const isSeller = !!user && Number(user.idRol) === 2;
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [clienteIdUsuario, setClienteIdUsuario] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [estado, setEstado] = useState('Entregado');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    loadCart();
    const handleCartUpdate = () => loadCart();
    window.addEventListener('cart:updated', handleCartUpdate);
    return () => window.removeEventListener('cart:updated', handleCartUpdate);
  }, []);

  // Cargar datos auxiliares para vendedor
  useEffect(() => {
    let mounted = true;
    if (!isSeller) return;
    (async () => {
      try {
        const [resCli, resSuc] = await Promise.all([
          api.get('/admin/clientes').catch(() => ({ data: [] })),
          api.get('/admin/sucursales').catch(() => ({ data: [] }))
        ]);
        if (!mounted) return;
        setClientes(resCli.data || []);
        const sucs = resSuc.data || [];
        setSucursales(sucs);
        if (sucs.length > 0) setSucursalId(String(sucs[0].idSucursal));
      } catch {
        if (mounted) {
          setClientes([]);
          setSucursales([]);
        }
      }
    })();
    return () => { mounted = false; };
  }, [isSeller]);

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

  // Checkout para usuarios comunes (cliente)
  const handleCheckout = async () => {
    if (!user) { 
      navigate('/login'); 
      return; 
    }
    
    if (cartItems.length === 0) { 
      alert('El carrito está vacío'); 
      return; 
    }

    // Preparar datos del pedido
    const productos = cartItems.map(item => ({
      idProducto: item.product.idProducto || item.product.id,
      cantidad: item.quantity
    }));

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productos: productos,
          observaciones: '' // Puedes agregar un campo para observaciones si quieres
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el pedido');
      }

      const result = await response.json();
      
      // Limpiar el carrito después del pedido exitoso
      clearCart();
      loadCart();
      
      // Mostrar mensaje de éxito
      alert(`¡Pedido creado exitosamente! Número de pedido: ${result.idPedido}`);
      
      // Opcional: navegar a una página de confirmación
      navigate('/');
      
    } catch (error) {
      console.error('Error creando pedido:', error);
      alert(`Error al crear el pedido: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Checkout para vendedor: crea pedido admin con selección de cliente/sucursal
  const handleSellerCheckout = async () => {
    if (!isSeller) return;
    if (!clienteIdUsuario) { alert('Seleccioná un cliente'); return; }
    if (cartItems.length === 0) { alert('El carrito está vacío'); return; }

    const productosPayload = cartItems.map((item) => ({
      idProducto: item.product.idProducto || item.product.id,
      cantidad: item.quantity,
      precioUnitario: Number(item.product?.precio ?? item.product?.price ?? 0)
    }));

    const obs = `Pago: ${metodoPago}${observaciones ? ' | ' + observaciones : ''}`;

    try {
      setLoading(true);
      const res = await api.post('/admin/pedidos', {
        idCliente: Number(clienteIdUsuario),
        estado,
        idSucursalOrigen: Number(sucursalId || 1),
        productos: productosPayload,
        observaciones: obs,
        metodoPago
      });
      clearCart();
      loadCart();
      alert(`Pedido creado (ID ${res.data?.idPedido || ''})`);
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('No se pudo crear el pedido');
    } finally {
      setLoading(false);
    }
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
              {/* Acciones para comprador normal */}
              {!isSeller && (
                <Stack spacing={1} sx={{ mt: 3 }}>
                  <Button variant={user ? 'contained' : 'outlined'} color={user ? 'success' : 'primary'} fullWidth onClick={handleCheckout} disabled={loading}>{loading ? 'Procesando...' : (user ? 'Hacer Pedido' : 'Iniciar sesión para pedir')}</Button>
                  <Button variant="outlined" fullWidth onClick={() => navigate('/')}>Seguir comprando</Button>
                  <Button variant="text" fullWidth color="error" onClick={handleClearCart}>Vaciar carrito</Button>
                </Stack>
              )}

              {/* Formulario y acción para vendedor */}
              {isSeller && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Registrar pedido (vendedor)</Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={clientes}
                        size="small"
                        getOptionLabel={(c) => `${c?.nombre ?? ''} ${c?.apellido ?? ''}`.trim()}
                        onChange={(_, val) => setClienteIdUsuario(val ? String(val.idUsuario) : '')}
                        renderInput={(params) => <TextField {...params} label="Cliente" placeholder="Buscar cliente..." />}
                        isOptionEqualToValue={(o, v) => String(o.idUsuario) === String(v.idUsuario)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={sucursales}
                        size="small"
                        getOptionLabel={(s) => s?.nombre ?? ''}
                        value={sucursales.find((s) => String(s.idSucursal) === String(sucursalId)) || null}
                        onChange={(_, val) => setSucursalId(val ? String(val.idSucursal) : '')}
                        renderInput={(params) => <TextField {...params} label="Sucursal" placeholder="Seleccione sucursal" />}
                        isOptionEqualToValue={(o, v) => String(o.idSucursal) === String(v.idSucursal)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Estado</InputLabel>
                        <Select label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
                          <MenuItem value="Entregado">Entregado</MenuItem>
                          <MenuItem value="En Proceso">En Proceso</MenuItem>
                          <MenuItem value="Pendiente">Pendiente</MenuItem>
                          <MenuItem value="Cancelado">Cancelado</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Forma de pago</InputLabel>
                        <Select label="Forma de pago" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                          <MenuItem value="Efectivo">Efectivo</MenuItem>
                          <MenuItem value="Tarjeta de crédito">Tarjeta de crédito</MenuItem>
                          <MenuItem value="Tarjeta de débito">Tarjeta de débito</MenuItem>
                          <MenuItem value="Transferencia">Transferencia</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} multiline minRows={2} />
                    </Grid>
                    <Grid item xs={12}>
                      <Stack spacing={1}>
                        <Button variant="contained" color="primary" fullWidth onClick={handleSellerCheckout} disabled={loading || !clienteIdUsuario || cartItems.length === 0}>{loading ? 'Procesando...' : 'Crear pedido'}</Button>
                        <Button variant="text" fullWidth color="error" onClick={handleClearCart}>Vaciar carrito</Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}