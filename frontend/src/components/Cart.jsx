import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateQuantity, removeFromCart, clearCart, getTotal, getSubtotal } from '../utils/cart';
import { formatCurrency, formatNumber } from '../utils/format';
import useAuthStore from '../store/useAuthStore';
import { OrdersAdminService } from '../services/OrdersAdminService';
import { OrdersClientService } from '../services/OrdersClientService';
import { CustomersService } from '../services/CustomersService';
import { SucursalesService } from '../services/SucursalesService';
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

  // Control de apertura de Selects para cerrar al hacer scroll
  const [openPagoCliente, setOpenPagoCliente] = useState(false);
  const [openCuotasCliente, setOpenCuotasCliente] = useState(false);
  const [openPagoVendedor, setOpenPagoVendedor] = useState(false);
  const [openCuotasVendedor, setOpenCuotasVendedor] = useState(false);

  const ordersAdminService = React.useMemo(() => new OrdersAdminService(), []);
  const ordersClientService = React.useMemo(() => new OrdersClientService(), []);
  const customersService = React.useMemo(() => new CustomersService(), []);
  const sucursalesService = React.useMemo(() => new SucursalesService(), []);

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
        const [cli, sucs] = await Promise.all([
          customersService.list().catch(() => []),
          sucursalesService.list().catch(() => [])
        ]);
        if (!mounted) return;
        setClientes(cli || []);
        setSucursales(sucs || []);
        if (sucs && sucs.length > 0) setSucursalId(String(sucs[0].idSucursal));
      } catch {
        if (mounted) {
          setClientes([]);
          setSucursales([]);
        }
      }
    })();
    return () => { mounted = false; };
  }, [isSeller]);

  // Cerrar selects si se scrollea la página
  useEffect(() => {
    if (!(openPagoCliente || openCuotasCliente || openPagoVendedor || openCuotasVendedor)) return;
    const close = () => {
      setOpenPagoCliente(false);
      setOpenCuotasCliente(false);
      setOpenPagoVendedor(false);
      setOpenCuotasVendedor(false);
    };
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
  }, [openPagoCliente, openCuotasCliente, openPagoVendedor, openCuotasVendedor]);

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

  // Helpers de cálculo reutilizables
  const getInteresFor = (metodo, c) => {
    if (metodo === 'Tarjeta de crédito') {
      if (c === 1) return 0;
      if (c === 3) return 10;
      if (c === 6) return 15;
      if (c === 9) return 20;
      if (c === 12) return 30;
    }
    return 0;
  };
  const getDescuentoFor = (metodo) => (metodo === 'Efectivo' ? 5 : 0);

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
      const result = await ordersClientService.create({
        productos,
        observaciones: '',
        metodoPago: clienteMetodoPago,
        cuotas: cuotas,
        interes: interes,
        descuento: descuento,
        totalConInteres: totalConAjustes
      });
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
      const res = await ordersAdminService.create({
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
      const pedidoId = res.idPedido || '';
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

  // Cálculos visibles para vendedor (usando los helpers en base a metodoPago/cuotas)
  const interesV = getInteresFor(metodoPago, cuotas);
  const descuentoV = getDescuentoFor(metodoPago);
  const totalConAjustesV = total + total * (interesV / 100) - total * (descuentoV / 100);
  const montoPorCuotaV = metodoPago === 'Tarjeta de crédito' && cuotas > 0 ? totalConAjustesV / cuotas : 0;

  const emptyCart = !cartItems || cartItems.length === 0;

  return (
    <Box sx={{ width: '100%', py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Mi Carrito</Typography>
        <Typography color="text.secondary">{formatNumber(itemCount)} {itemCount === 1 ? 'producto' : 'productos'}</Typography>
      </Box>

      {emptyCart && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Box sx={{
            width: '100%',
            maxWidth: 760,
            border: '1px solid #e5e9ef',
            borderRadius: 0,
            bgcolor: '#fff',
            p: { xs: 3, md: 4 },
            textAlign: 'center'
          }}>
            <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary', width: 64, height: 64, mx: 'auto', mb: 2 }}>🛒</Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Tu carrito está vacío</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Agregá algunos productos para comenzar</Typography>
            <Button variant="contained" onClick={() => navigate('/')} sx={{ borderRadius: 0, px: 3, py: 1.1 }}>Ver productos</Button>
          </Box>
        </Box>
      )}

      {!emptyCart && (
      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} md={8}>
          {(!emptyCart) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {cartItems.filter(item => item && item.product).map(item => {
                const product = item.product;
                const subtotal = getSubtotal(item);
                const unitPrice = parseFloat(product.price || product.precio || 0);
                const resolveImage = (prod) => {
                  if (!prod) return '/img/no-image.jpg';
                  if (Array.isArray(prod.imagenes) && prod.imagenes.length > 0) {
                    const first = String(prod.imagenes[0]);
                    if (first.startsWith('http')) return first;
                    return first.startsWith('uploads/') ? `http://localhost:3000/${first}` : `http://localhost:3000/uploads/${first}`;
                  }
                  if (typeof prod.imagen === 'string' && prod.imagen.trim()) {
                    const raw = prod.imagen.includes(',') ? prod.imagen.split(',')[0].trim() : prod.imagen.trim();
                    if (raw.startsWith('data:') || raw.startsWith('http')) return raw;
                    return raw.startsWith('uploads/') ? `http://localhost:3000/${raw}` : `http://localhost:3000/uploads/${raw}`;
                  }
                  if (typeof prod.image === 'string' && prod.image.trim()) return `http://localhost:3000/uploads/${prod.image.trim()}`;
                  return '/img/no-image.jpg';
                };
                const imageUrl = resolveImage(product);
                return (
                  <Box key={item.id} sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '72px 1fr', sm: '84px 1fr 120px 160px 120px 40px' },
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 },
                    p: { xs: 1.25, sm: 1.5 },
                    border: '1px solid #e5e9ef',
                    borderRadius: 0,
                    bgcolor: '#fff'
                  }}>
                    <Box sx={{ width: { xs: 72, sm: 84 }, height: { xs: 72, sm: 84 }, overflow: 'hidden' }}>
                      <img src={imageUrl} alt={product.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=> e.target.src = '/img/no-image.jpg'} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.25, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{product.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">{product.categoria || 'Sin categoría'}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                        {formatCurrency(unitPrice)} x {item.quantity} = {formatCurrency(subtotal)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'center', fontWeight: 700 }}>{formatCurrency(unitPrice)}</Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'center' }, gap: 1, gridColumn: { xs: '1 / span 2', sm: 'auto' } }}>
                      <IconButton size="small" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><RemoveIcon /></IconButton>
                      <TextField value={item.quantity} size="small" inputProps={{ style: { textAlign: 'center', width: 56 } }} onChange={(e) => { const q = Math.max(1, parseInt(e.target.value) || 1); handleQuantityChange(item.id, q); }} />
                      <IconButton size="small" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}><AddIcon /></IconButton>
                    </Box>
                    <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'center', fontWeight: 700 }}>{formatCurrency(subtotal)}</Box>
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center' }}>
                      <IconButton color="error" onClick={() => { if (window.confirm(`¿Eliminar ${product.nombre} del carrito?`)) handleRemoveItem(item.id); }}><DeleteIcon /></IconButton>
                    </Box>
                    <Box sx={{ display: { xs: 'flex', sm: 'none' }, gridColumn: '1 / span 2', justifyContent: 'flex-end' }}>
                      <Button size="small" color="error" variant="text" onClick={() => { if (window.confirm(`¿Eliminar ${product.nombre} del carrito?`)) handleRemoveItem(item.id); }}>Eliminar</Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 0, border: '1px solid #e5e9ef', position: { md: 'sticky' }, top: { md: 24 } }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Resumen del pedido</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Productos ({itemCount})</Typography>
                <Typography>{formatCurrency(total)}</Typography>
              </Box>
              {isSeller && !emptyCart && (
                <>
                  {/* Ajustes para vendedor visibles en el resumen */}
                  {descuentoV > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'success.main' }}>
                      <Typography variant="body2">Descuento ({descuentoV}%)</Typography>
                      <Typography variant="body2">-{formatCurrency(total * (descuentoV / 100))}</Typography>
                    </Box>
                  )}
                  {interesV > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'warning.main' }}>
                      <Typography variant="body2">Interés ({interesV}%)</Typography>
                      <Typography variant="body2">+{formatCurrency(total * (interesV / 100))}</Typography>
                    </Box>
                  )}
                  {metodoPago === 'Tarjeta de crédito' && cuotas > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Valor por cuota</Typography>
                      <Typography variant="body2" color="text.secondary">{formatCurrency(montoPorCuotaV)}</Typography>
                    </Box>
                  )}
                </>
              )}
              
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
                      open={openPagoCliente}
                      onOpen={() => setOpenPagoCliente(true)}
                      onClose={() => setOpenPagoCliente(false)}
                      MenuProps={{ disableScrollLock: true }}
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
                        open={openCuotasCliente}
                        onOpen={() => setOpenCuotasCliente(true)}
                        onClose={() => setOpenCuotasCliente(false)}
                        MenuProps={{ disableScrollLock: true }}
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
                  {!isSeller && user ? formatCurrency(calcularTotalConAjustes()) : formatCurrency(totalConAjustesV)}
                </Typography>
              </Box>

              {!user && !emptyCart && (
                <Alert severity="warning" sx={{ mt: 2 }}>Necesitas iniciar sesión para realizar el pedido</Alert>
              )}
              {/* Acciones para comprador normal */}
              {!isSeller && !emptyCart && (
                <Stack spacing={1} sx={{ mt: 3 }}>
                  <Button sx={{ borderRadius: 0, py: 1.2, fontWeight: 800 }} variant={user ? 'contained' : 'outlined'} color={user ? 'success' : 'primary'} fullWidth onClick={handleCheckout} disabled={loading}>{loading ? 'Procesando...' : (user ? 'Hacer Pedido' : 'Iniciar sesión para pedir')}</Button>
                  <Button sx={{ borderRadius: 0 }} variant="outlined" fullWidth onClick={() => navigate('/')}>Seguir comprando</Button>
                  <Button sx={{ borderRadius: 0 }} variant="text" fullWidth color="error" onClick={handleClearCart}>Vaciar carrito</Button>
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
                        <Select label="Forma de pago" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} open={openPagoVendedor} onOpen={() => setOpenPagoVendedor(true)} onClose={() => setOpenPagoVendedor(false)} MenuProps={{ disableScrollLock: true }}>
                          <MenuItem value="Efectivo">Efectivo</MenuItem>
                          <MenuItem value="Tarjeta de crédito">Tarjeta de crédito</MenuItem>
                          <MenuItem value="Tarjeta de débito">Tarjeta de débito</MenuItem>
                          <MenuItem value="Transferencia">Transferencia</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {metodoPago === 'Tarjeta de crédito' && (
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Cuotas</InputLabel>
                          <Select label="Cuotas" value={cuotas} onChange={(e) => setCuotas(Number(e.target.value))} open={openCuotasVendedor} onOpen={() => setOpenCuotasVendedor(true)} onClose={() => setOpenCuotasVendedor(false)} MenuProps={{ disableScrollLock: true }}>
                            <MenuItem value={1}>1 cuota (0% interés)</MenuItem>
                            <MenuItem value={3}>3 cuotas (10% interés)</MenuItem>
                            <MenuItem value={6}>6 cuotas (15% interés)</MenuItem>
                            <MenuItem value={9}>9 cuotas (20% interés)</MenuItem>
                            <MenuItem value={12}>12 cuotas (30% interés)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Box sx={{ p: 1.5, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Resumen de pago</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="body2">Subtotal</Typography>
                          <Typography variant="body2">{formatCurrency(total)}</Typography>
                        </Box>
                        {descuentoV > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="body2" color="success.main">Descuento ({descuentoV}%)</Typography>
                            <Typography variant="body2" color="success.main">- {formatCurrency(total * (descuentoV/100))}</Typography>
                          </Box>
                        )}
                        {interesV > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">Interés ({interesV}%)</Typography>
                            <Typography variant="body2" color="text.secondary">+ {formatCurrency(total * (interesV/100))}</Typography>
                          </Box>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{formatCurrency(totalConAjustesV)}</Typography>
                        </Box>
                        {metodoPago === 'Tarjeta de crédito' && (
                          <Typography variant="caption" color="text.secondary">{cuotas} cuotas de {formatCurrency(montoPorCuotaV)}</Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} multiline minRows={2} />
                    </Grid>
                    <Grid item xs={12}>
                      <Stack spacing={1}>
                        <Button variant="contained" color="primary" fullWidth sx={{ borderRadius: 0 }} onClick={handleSellerCheckout} disabled={loading || !clienteIdUsuario || cartItems.length === 0}>{loading ? 'Procesando...' : 'Crear pedido'}</Button>
                        <Button variant="text" fullWidth color="error" sx={{ borderRadius: 0 }} onClick={handleClearCart}>Vaciar carrito</Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}
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