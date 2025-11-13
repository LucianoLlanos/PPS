import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateQuantity, removeFromCart, clearCart, getTotal, getSubtotal } from '../utils/cart';
import { formatCurrency, formatNumber } from '../utils/format';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Button, Card, CardContent, Grid, Avatar, Stack, Alert, Divider, FormControl, InputLabel, Select, MenuItem, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
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
  
  // Datos para método de pago del cliente
  const [clienteMetodoPago, setClienteMetodoPago] = useState('Efectivo');
  const [cuotas, setCuotas] = useState(1);
  
  // Modal de confirmación de pedido (cliente o vendedor)
  const [orderModal, setOrderModal] = useState({ open: false, id: null, modo: 'cliente', extra: null });
  const [canCloseModal, setCanCloseModal] = useState(true);

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

  // Calcular interes según método de pago y cuotas
  const calcularInteres = () => {
    if (clienteMetodoPago === 'Tarjeta de crédito') {
      if (cuotas === 1) return 0;
      if (cuotas === 3) return 10;
      if (cuotas === 6) return 15;
      if (cuotas === 9) return 20;
      if (cuotas === 12) return 30;
    }
    return 0;
  };

  const calcularDescuento = () => {
    return clienteMetodoPago === 'Efectivo' ? 5 : 0;
  };

  const calcularTotalConAjustes = () => {
    const subtotal = getTotal();
    const interes = calcularInteres();
    const descuento = calcularDescuento();
    
    const montoInteres = subtotal * (interes / 100);
    const montoDescuento = subtotal * (descuento / 100);
    
    return subtotal + montoInteres - montoDescuento;
  };

  // Checkout para usuarios comunes (cliente)
  const handleCheckout = async () => {
    if (!user) { 
      navigate('/login'); 
      return; 
    }
    
    if (cartItems.length === 0) {
      setOrderModal({ open: true, id: null, modo: 'error', extra: 'El carrito está vacío' });
      return;
    }

    const productos = cartItems.map(item => ({
      idProducto: item.product.idProducto || item.product.id,
      cantidad: item.quantity
    }));

    const interes = calcularInteres();
    const descuento = calcularDescuento();
    const totalConAjustes = calcularTotalConAjustes();

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          productos, 
          observaciones: '',
          metodoPago: clienteMetodoPago,
          cuotas: cuotas,
          interes: interes,
          descuento: descuento,
          totalConInteres: totalConAjustes
        })
      });
      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || 'Error al crear el pedido');
      }
      const result = await response.json();
      const pedidoId = result.idPedido;
      clearCart();
      loadCart();
      setOrderModal({ open: true, id: pedidoId, modo: 'cliente', extra: null });
    } catch (error) {
      console.error('Error creando pedido:', error);
      setOrderModal({ open: true, id: null, modo: 'error', extra: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Checkout para vendedor: crea pedido admin con selección de cliente/sucursal
  const handleSellerCheckout = async () => {
    if (!isSeller) return;
    if (!clienteIdUsuario) { setOrderModal({ open: true, id: null, modo: 'error', extra: 'Seleccioná un cliente' }); return; }
    if (cartItems.length === 0) { setOrderModal({ open: true, id: null, modo: 'error', extra: 'El carrito está vacío' }); return; }

    const productosPayload = cartItems.map(item => ({
      idProducto: item.product.idProducto || item.product.id,
      cantidad: item.quantity,
      precioUnitario: Number(item.product?.precio ?? item.product?.price ?? 0)
    }));
    // Calcular ajustes para vendedor según método de pago/ cuotas
    const calcularInteresV = () => {
      if (metodoPago === 'Tarjeta de crédito') {
        if (cuotas === 1) return 0;
        if (cuotas === 3) return 10;
        if (cuotas === 6) return 15;
        if (cuotas === 9) return 20;
        if (cuotas === 12) return 30;
      }
      return 0;
    };
    const calcularDescuentoV = () => (metodoPago === 'Efectivo' ? 5 : 0);
    const subtotalV = getTotal();
    const interesV = calcularInteresV();
    const descuentoV = calcularDescuentoV();
    const totalConAjustesV = subtotalV + subtotalV * (interesV / 100) - subtotalV * (descuentoV / 100);

    const obs = `Pago: ${metodoPago}${observaciones ? ' | ' + observaciones : ''}`;
    try {
      setLoading(true);
      const res = await api.post('/admin/pedidos', {
        idCliente: Number(clienteIdUsuario),
        estado,
        idSucursalOrigen: Number(sucursalId || 1),
        productos: productosPayload,
        observaciones: obs,
        metodoPago,
        cuotas,
        interes: interesV,
        descuento: descuentoV,
        totalConInteres: totalConAjustesV
      });
      const pedidoId = res.data?.idPedido || '';
      clearCart();
      loadCart();
      setOrderModal({ open: true, id: pedidoId, modo: 'vendedor', extra: { sucursal: sucursales.find(s => String(s.idSucursal) === String(sucursalId))?.nombre || '' } });
    } catch (e) {
      console.error(e);
      setOrderModal({ open: true, id: null, modo: 'error', extra: 'No se pudo crear el pedido' });
    } finally {
      setLoading(false);
    }
  };

  // Mantener visible hasta 2 minutos (autocierre) pero permitir cierre manual inmediato
  useEffect(() => {
    if (orderModal.open && orderModal.modo !== 'error') {
      setCanCloseModal(true); // permitir cierre manual desde el inicio
      const t = setTimeout(() => {
        setOrderModal({ open: false, id: null, modo: 'cliente', extra: null });
        navigate('/');
      }, 120000); // 2 minutos
      return () => clearTimeout(t);
    }
  }, [orderModal.open, orderModal.modo, navigate]);

  const total = getTotal();
  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const emptyCart = !cartItems || cartItems.length === 0;

  return (
    <Box sx={{ width: '100%', py: 3 }}>
      {emptyCart && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Stack spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary' }}>🛒</Avatar>
            <Typography variant="h6">Tu carrito está vacío</Typography>
            <Typography color="text.secondary">Agrega algunos productos para comenzar</Typography>
            <Button variant="contained" onClick={() => navigate('/')}>Ver productos</Button>
          </Stack>
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Mi Carrito</Typography>
  <Typography color="text.secondary">{formatNumber(itemCount)} {itemCount === 1 ? 'producto' : 'productos'}</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {!emptyCart && (
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
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Resumen del pedido</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Productos ({itemCount})</Typography>
                <Typography>{formatCurrency(total)}</Typography>
              </Box>
              
              {!isSeller && user && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Método de pago</Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Forma de pago</InputLabel>
                    <Select 
                      label="Forma de pago" 
                      value={clienteMetodoPago} 
                      onChange={(e) => {
                        setClienteMetodoPago(e.target.value);
                        if (e.target.value !== 'Tarjeta de crédito') {
                          setCuotas(1);
                        }
                      }}
                    >
                      <MenuItem value="Efectivo">Efectivo (5% descuento)</MenuItem>
                      <MenuItem value="Tarjeta de crédito">Tarjeta de crédito</MenuItem>
                      <MenuItem value="Tarjeta de débito">Tarjeta de débito</MenuItem>
                      <MenuItem value="Transferencia">Transferencia</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {clienteMetodoPago === 'Tarjeta de crédito' && (
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Cuotas</InputLabel>
                      <Select 
                        label="Cuotas" 
                        value={cuotas} 
                        onChange={(e) => setCuotas(e.target.value)}
                      >
                        <MenuItem value={1}>1 cuota (sin interés)</MenuItem>
                        <MenuItem value={3}>3 cuotas (10% interés)</MenuItem>
                        <MenuItem value={6}>6 cuotas (15% interés)</MenuItem>
                        <MenuItem value={9}>9 cuotas (20% interés)</MenuItem>
                        <MenuItem value={12}>12 cuotas (30% interés)</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                  
                  {calcularDescuento() > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'success.main' }}>
                      <Typography variant="body2">Descuento ({calcularDescuento()}%)</Typography>
                      <Typography variant="body2">-{formatCurrency(total * (calcularDescuento() / 100))}</Typography>
                    </Box>
                  )}
                  
                  {calcularInteres() > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'warning.main' }}>
                      <Typography variant="body2">Interés ({calcularInteres()}%)</Typography>
                      <Typography variant="body2">+{formatCurrency(total * (calcularInteres() / 100))}</Typography>
                    </Box>
                  )}
                  
                  {clienteMetodoPago === 'Tarjeta de crédito' && cuotas > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Valor por cuota</Typography>
                      <Typography variant="body2" color="text.secondary">{formatCurrency(calcularTotalConAjustes() / cuotas)}</Typography>
                    </Box>
                  )}
                </>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Envío</Typography>
                <Typography color="success.main">Gratis</Typography>
              </Box>
              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">
                  {!isSeller && user ? formatCurrency(calcularTotalConAjustes()) : formatCurrency(total)}
                </Typography>
              </Box>

              {!user && !emptyCart && (
                <Alert severity="warning" sx={{ mt: 2 }}>Necesitas iniciar sesión para realizar el pedido</Alert>
              )}
              {/* Acciones para comprador normal */}
              {!isSeller && !emptyCart && (
                <Stack spacing={1} sx={{ mt: 3 }}>
                  <Button variant={user ? 'contained' : 'outlined'} color={user ? 'success' : 'primary'} fullWidth onClick={handleCheckout} disabled={loading}>{loading ? 'Procesando...' : (user ? 'Hacer Pedido' : 'Iniciar sesión para pedir')}</Button>
                  <Button variant="outlined" fullWidth onClick={() => navigate('/')}>Seguir comprando</Button>
                  <Button variant="text" fullWidth color="error" onClick={handleClearCart}>Vaciar carrito</Button>
                </Stack>
              )}

              {/* Formulario y acción para vendedor */}
              {isSeller && !emptyCart && (
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
      {/* Modal de confirmación / error de pedido */}
    <Dialog open={orderModal.open} onClose={() => { if (orderModal.modo === 'error' || canCloseModal) { setOrderModal({ open: false, id: null, modo: 'cliente', extra: null }); if (orderModal.modo !== 'error') navigate('/'); } }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {orderModal.modo === 'cliente' && 'Pedido realizado'}
          {orderModal.modo === 'vendedor' && 'Pedido registrado'}
          {orderModal.modo === 'error' && 'Aviso'}
        </DialogTitle>
        <DialogContent dividers>
          {orderModal.modo === 'cliente' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>¡Gracias por tu compra!</Typography>
              <Typography sx={{ mb: 2 }}>Tu pedido fue procesado correctamente.</Typography>
              <Typography variant="body2" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
                Número de pedido: <strong>{orderModal.id}</strong><br />
                Presenta este número o tu nombre al momento de retirar y pagar en la sucursal.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display:'block' }}>
                Te enviaremos actualizaciones del estado si corresponde.
              </Typography>
            </Box>
          )}
          {orderModal.modo === 'vendedor' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>Pedido cargado en caja</Typography>
              <Typography sx={{ mb: 2 }}>El pedido se registró correctamente para el cliente seleccionado.</Typography>
              <Typography variant="body2" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
                ID Pedido: <strong>{orderModal.id}</strong><br />
                Sucursal: <strong>{orderModal.extra?.sucursal || 'N/D'}</strong><br />
                El cliente puede retirarlo presentando el número o su nombre.
              </Typography>
            </Box>
          )}
          {orderModal.modo === 'error' && (
            <Box>
              <Typography variant="h6" color="error" sx={{ mb: 1 }}>No se pudo continuar</Typography>
              <Alert severity="error" variant="outlined">{orderModal.extra || 'Ocurrió un error desconocido'}</Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {orderModal.modo !== 'error' && (
            <Button onClick={() => { setOrderModal({ open: false, id: null, modo: 'cliente', extra: null }); navigate('/'); }} variant="contained" color="primary">Cerrar</Button>
          )}
          {orderModal.modo === 'error' && (
            <Button onClick={() => setOrderModal({ open: false, id: null, modo: 'cliente', extra: null })} variant="contained">Entendido</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}