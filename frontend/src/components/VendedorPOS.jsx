import React, { useEffect, useMemo, useState } from 'react';
import { ProductsService } from '../services/ProductsService';
import { CustomersService } from '../services/CustomersService';
import { SucursalesService } from '../services/SucursalesService';
import { OrdersAdminService } from '../services/OrdersAdminService';
import { StockService } from '../services/StockService';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { AddShoppingCart, PersonAdd } from '@mui/icons-material';
import {
  getCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  getTotal,
  clearCart,
  getSubtotal
} from '../utils/cart';
import useAuthStore from '../store/useAuthStore';
import '../stylos/VendedorPOS.css';

export default function VendedorPOS() {
  const user = useAuthStore((s) => s.user);

  const productsService = React.useMemo(() => new ProductsService(), []);
  const customersService = React.useMemo(() => new CustomersService(), []);
  const sucursalesService = React.useMemo(() => new SucursalesService(), []);
  const ordersAdminService = React.useMemo(() => new OrdersAdminService(), []);
  const stockService = React.useMemo(() => new StockService(), []);

  // Datos
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [insufficientStock, setInsufficientStock] = useState([]);

  // UI / formulario
  const [q, setQ] = useState('');
  const [cartItems, setCartItems] = useState(getCart());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // cliente rápido
  const [openNewClient, setOpenNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ nombre: '', apellido: '', telefono: '', direccion: '' });
  const [newClientEmail, setNewClientEmail] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientError, setClientError] = useState(null);

  // pedido
  const [clienteIdUsuario, setClienteIdUsuario] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [sucursalId, setSucursalId] = useState('1');
  const [estado, setEstado] = useState('Entregado');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [observaciones, setObservaciones] = useState('');

  // modal resultado pedido
  const [orderModal, setOrderModal] = useState({ open: false, id: null, modo: 'ok', extra: null });

  const total = useMemo(() => getTotal(), [cartItems]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, c, s] = await Promise.all([
          productsService.listPublic().catch(() => []),
          customersService.list().catch(() => []),
          sucursalesService.list().catch(() => [])
        ]);
        setProductos(p || []);
        setClientes(c || []);
        setSucursales(s || []);
        if ((s || []).length > 0) setSucursalId(String(s[0].idSucursal));
      } catch (e) {
        console.error('Carga inicial VendedorPOS2 error', e);
      } finally {
        setLoading(false);
      }
    };
    load();

    const onUpd = () => setCartItems(getCart());
    window.addEventListener('cart:updated', onUpd);
    return () => window.removeEventListener('cart:updated', onUpd);
  }, []);

  // Cuando cambia la sucursal seleccionada o el carrito, validar stock disponible
  useEffect(() => {
    let mounted = true;
    const checkStock = async () => {
      try {
        // obtener listado completo de stock por sucursal
        const stockList = await stockService.listStockSucursal();
        if (!mounted) return;
        const sucId = Number(sucursalId || 0);
        if (!sucId) {
          setInsufficientStock([]);
          return;
        }
        const cart = getCart();
        const insuff = [];
        for (const it of cart) {
          const prodId = Number(it.product?.idProducto || it.product?.id || it.id);
          const qty = Number(it.quantity || 1);
          const entry = (stockList || []).find(s => Number(s.idSucursal) === sucId && Number(s.idProducto) === prodId);
          const available = entry ? Number(entry.stockDisponible || 0) : 0;
          if (available < qty) {
            insuff.push({ id: prodId, nombre: it.product?.nombre || it.product?.name || it.product?.descripcion || String(prodId), required: qty, available });
          }
        }
        setInsufficientStock(insuff);
      } catch (e) {
        // no bloquear por errores de validación; dejar la lista vacía
        console.warn('[VendedorPOS] no se pudo validar stock', e);
        setInsufficientStock([]);
      }
    };
    checkStock();
    return () => { mounted = false; };
  }, [sucursalId, cartItems, stockService]);

  const filtered = productos.filter((p) => (`${p.nombre || ''} ${p.descripcion || ''}`).toLowerCase().includes(q.toLowerCase()));

  const handleAdd = (p) => {
    addToCart(p, 1);
    setCartItems(getCart());
  };

  const handleCreateClient = async () => {
    setClientError(null);
    if (!newClient.nombre || !newClient.apellido || !newClient.telefono) {
      setClientError('Nombre, apellido y teléfono son obligatorios');
      return;
    }
    try {
      setCreatingClient(true);
      const res = await customersService.createMinimal(newClient);
      const created = res?.cliente || res;
      if (created) {
        setClientes((prev) => [...(prev || []), created]);
        setClienteIdUsuario(String(created.idUsuario || created.idCliente || ''));
        setSelectedCliente(created);
        setOpenNewClient(false);
        setNewClient({ nombre: '', apellido: '', telefono: '', direccion: '' });
      }
    } catch (e) {
      console.error('createMinimal error', e);
      setClientError(e?.response?.data?.error || e.message || 'Error al crear cliente');
    } finally {
      setCreatingClient(false);
    }
  };

  const handleCheckout = async () => {
    if (!user || Number(user.idRol) !== 2) {
      setOrderModal({ open: true, id: null, modo: 'error', extra: 'Solo vendedores pueden registrar pedidos desde esta vista' });
      return;
    }
    if (!clienteIdUsuario) {
      setOrderModal({ open: true, id: null, modo: 'error', extra: 'Seleccioná un cliente' });
      return;
    }

    const items = getCart();
    if (!items || items.length === 0) {
      setOrderModal({ open: true, id: null, modo: 'error', extra: 'El carrito está vacío' });
      return;
    }

    const productosPayload = items.map((i) => ({ idProducto: i.id, cantidad: i.quantity, precioUnitario: Number(i.product?.precio ?? i.product?.price ?? 0) }));
    const obs = `Pago: ${metodoPago}${observaciones ? ' | ' + observaciones : ''}`;

      try {
        setSubmitting(true);
        const res = await ordersAdminService.create({ idCliente: Number(clienteIdUsuario), estado, idSucursalOrigen: Number(sucursalId || 1), productos: productosPayload, observaciones: obs });
        console.debug('Respuesta create pedido:', res);
        const pedidoId = res?.idPedido || res?.id || null;

        // crear retiro (best-effort) si hay teléfono
        let codigoRetiro = null;
        let retiroError = null;
        try {
          const telefono = selectedCliente?.telefono || (newClient?.telefono) || null;
          if (telefono && pedidoId) {
            const retiroRes = await ordersAdminService.createRetiro(pedidoId, telefono);
            console.debug('Respuesta create retiro:', retiroRes);
            codigoRetiro = retiroRes?.codigo || retiroRes?.code || retiroRes?.codigoRetiro || null;
            if (!codigoRetiro && retiroRes && retiroRes.idRetiro) {
              // fallback: sometimes backend returns only id
              codigoRetiro = retiroRes.idRetiro;
            }
          }
        } catch (err) {
          console.warn('No se pudo crear código de retiro:', err);
          retiroError = err?.response?.data || err?.message || String(err);
        }

        clearCart();
        setCartItems(getCart());
        setOrderModal({
          open: true,
          id: pedidoId,
          modo: 'ok',
          extra: {
            sucursal: (sucursales.find(s => String(s.idSucursal) === String(sucursalId))?.nombre) || '',
            codigoRetiro,
            retiroError
          }
        });
      } catch (e) {
        console.error(e);
        setOrderModal({ open: true, id: null, modo: 'error', extra: 'No se pudo crear el pedido' });
      } finally {
        setSubmitting(false);
      }
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 3, mb: 6 }} className="vendedor-pos">
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Punto de Venta</Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>Elegí productos, asigná cliente y sucursal, y registrá el pedido con su forma de pago.</Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card className="pos-card" sx={{ mb: 2 }}>
              <CardContent>
                <TextField fullWidth size="medium" placeholder="Buscar productos por nombre o descripción..." value={q} onChange={(e) => setQ(e.target.value)} />
              </CardContent>
            </Card>

            {loading ? <Typography>Cargando productos...</Typography> : (
              <Grid container spacing={2} className="products-grid">
                {filtered.map((p) => (
                  <Grid item xs={12} sm={6} key={p.idProducto} className="product-item">
                    <Card className="pos-card product-card">
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 1 }}>{p.nombre}</Typography>
                        <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>{p.descripcion}</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>$ {Number(p.precio).toFixed(2)}</Typography>
                      </CardContent>
                      <CardActions sx={{ px: 2, pb: 2 }}>
                        <Button fullWidth variant="contained" size="medium" startIcon={<AddShoppingCart />} onClick={() => handleAdd(p)}>Agregar</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          <Grid item xs={12} md={5}>
            <Card className="pos-card">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Carrito</Typography>
                {cartItems.length === 0 ? <Typography variant="body2" color="text.secondary">Sin productos</Typography> : (
                  <Box>
                    {cartItems.map((it) => (
                      <Box key={it.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{it.product?.nombre}</Typography>
                          <Typography variant="body2" color="text.secondary">$ {Number(it.product?.precio ?? it.product?.price ?? 0).toFixed(2)} x {it.quantity} = $ {getSubtotal(it).toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button variant="outlined" size="small" onClick={() => updateQuantity(it.id, Math.max(1, (it.quantity || 1) - 1))}>-</Button>
                          <Typography sx={{ px: 1, lineHeight: '32px', minWidth: 24, textAlign: 'center' }}>{it.quantity}</Typography>
                          <Button variant="outlined" size="small" onClick={() => updateQuantity(it.id, (it.quantity || 1) + 1)}>+</Button>
                          <Button variant="outlined" size="small" color="error" onClick={() => removeFromCart(it.id)}>Quitar</Button>
                        </Box>
                      </Box>
                    ))}
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h6">Total: $ {total.toFixed(2)}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card className="pos-card sticky" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Registrar pedido</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete size="medium" options={clientes} getOptionLabel={(c) => `${c?.nombre ?? ''} ${c?.apellido ?? ''}`.trim()} onChange={(_, val) => { setClienteIdUsuario(val ? String(val.idUsuario) : ''); setSelectedCliente(val || null); }} renderInput={(params) => <TextField {...params} label="Cliente" placeholder="Buscar cliente..." />} isOptionEqualToValue={(o, v) => String(o.idUsuario) === String(v.idUsuario)} />
                    <Box sx={{ mt: 1 }}><Button size="small" variant="contained" color="primary" fullWidth startIcon={<PersonAdd />} onClick={() => setOpenNewClient(true)} data-testid="nuevo-cliente-btn">Nuevo cliente</Button></Box>
                  </Grid>
                  <Grid item xs={12} sm={6}><Autocomplete size="medium" options={sucursales} getOptionLabel={(s) => s?.nombre ?? ''} value={sucursales.find((s) => String(s.idSucursal) === String(sucursalId)) || null} onChange={(_, val) => setSucursalId(val ? String(val.idSucursal) : '')} renderInput={(params) => <TextField {...params} label="Sucursal" placeholder="Seleccione sucursal" />} isOptionEqualToValue={(o, v) => String(o.idSucursal) === String(v.idSucursal)} /></Grid>

                  {insufficientStock && insufficientStock.length > 0 ? (
                    <Grid item xs={12}>
                      <Alert severity="warning">La sucursal seleccionada no tiene stock suficiente para {insufficientStock.length} producto(s): {insufficientStock.map(i => `${i.nombre} (necesita ${i.required}, disponible ${i.available})`).join(', ')}. Cambiá la sucursal o ajustá las cantidades antes de crear el pedido.</Alert>
                    </Grid>
                  ) : null}
                  <Grid item xs={12} sm={6}><FormControl fullWidth size="medium"><InputLabel>Estado</InputLabel><Select label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}><MenuItem value="Entregado">Entregado</MenuItem><MenuItem value="En Proceso">En Proceso</MenuItem><MenuItem value="Pendiente">Pendiente</MenuItem><MenuItem value="Cancelado">Cancelado</MenuItem></Select></FormControl></Grid>
                  <Grid item xs={12} sm={6}><FormControl fullWidth size="medium"><InputLabel>Forma de pago</InputLabel><Select label="Forma de pago" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}><MenuItem value="Efectivo">Efectivo</MenuItem><MenuItem value="Tarjeta de crédito">Tarjeta de crédito</MenuItem><MenuItem value="Tarjeta de débito">Tarjeta de débito</MenuItem><MenuItem value="Transferencia">Transferencia</MenuItem></Select></FormControl></Grid>
                  <Grid item xs={12}><TextField fullWidth size="medium" label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} multiline minRows={2} /></Grid>
                  <Grid item xs={12}><Button fullWidth variant="contained" size="large" disabled={submitting || cartItems.length === 0 || (insufficientStock && insufficientStock.length > 0)} onClick={handleCheckout}>Crear pedido</Button></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={orderModal.open} onClose={() => setOrderModal({ open: false, id: null, modo: 'ok', extra: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{orderModal.modo === 'ok' ? 'Pedido registrado' : 'Aviso'}</DialogTitle>
        <DialogContent dividers>
          {orderModal.modo === 'ok' ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>Carga exitosa</Typography>
              <Typography sx={{ mb: 2 }}>El pedido se registró correctamente.</Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
                <Typography variant="body2">ID Pedido: <strong>{orderModal.id}</strong></Typography>
                <Typography variant="body2">Sucursal: <strong>{orderModal.extra?.sucursal || 'N/D'}</strong></Typography>
                {orderModal.extra?.codigoRetiro ? (
                  <Typography variant="body2" sx={{ mt: 1 }}>Código de retiro: <strong>{orderModal.extra.codigoRetiro}</strong></Typography>
                ) : null}
                {orderModal.extra?.retiroError ? (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>No se pudo generar código de retiro: {typeof orderModal.extra.retiroError === 'string' ? orderModal.extra.retiroError : JSON.stringify(orderModal.extra.retiroError)}</Typography>
                ) : null}
              </Box>
            </Box>
          ) : (
            <Alert severity="error" variant="outlined">{orderModal.extra || 'Ocurrió un error'}</Alert>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setOrderModal({ open: false, id: null, modo: 'ok', extra: null })} variant="contained">Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={openNewClient} onClose={() => setOpenNewClient(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo cliente rápido</DialogTitle>
        <DialogContent dividers>
          {clientError ? <Alert severity="error" sx={{ mb: 1 }}>{clientError}</Alert> : null}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label="Nombre" fullWidth value={newClient.nombre} onChange={(e) => setNewClient(s => ({ ...s, nombre: e.target.value }))} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Apellido" fullWidth value={newClient.apellido} onChange={(e) => setNewClient(s => ({ ...s, apellido: e.target.value }))} /></Grid>
              <Grid item xs={12}><TextField label="Teléfono" fullWidth value={newClient.telefono} onChange={(e) => setNewClient(s => ({ ...s, telefono: e.target.value }))} /></Grid>
              <Grid item xs={12}><TextField label="Email (opcional)" fullWidth value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} /></Grid>
              <Grid item xs={12}><TextField label="Dirección (opcional)" fullWidth value={newClient.direccion} onChange={(e) => setNewClient(s => ({ ...s, direccion: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewClient(false)}>Cancelar</Button>
          <Button variant="contained" disabled={creatingClient} onClick={async () => {
            setClientError(null);
            if (!newClient.nombre || !newClient.apellido || !newClient.telefono) { setClientError('Nombre, apellido y teléfono son obligatorios'); return; }
            try {
              setCreatingClient(true);
              const payload = { ...newClient, email: newClientEmail || undefined };
              const res = await customersService.createMinimal(payload);
              const created = res && res.cliente ? res.cliente : (res && res.cliente) || res;
              if (created) {
                setClientes(prev => [ ...(prev || []), created ]);
                setClienteIdUsuario(String(created.idUsuario || created.idCliente || ''));
                setSelectedCliente(created);
                setOpenNewClient(false);
                setNewClient({ nombre: '', apellido: '', telefono: '', direccion: '' });
                setNewClientEmail('');
              }
            } catch (e) {
              console.error('createMinimal error', e);
              setClientError(e?.response?.data?.error || e.message || 'Error al crear cliente');
            } finally {
              setCreatingClient(false);
            }
          }}>Crear</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
