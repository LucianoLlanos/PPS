import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
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
  Typography
} from '@mui/material';
import { AddShoppingCart } from '@mui/icons-material';
import { getCart, addToCart, removeFromCart, updateQuantity, getTotal, clearCart, getSubtotal } from '../utils/cart';
import useAuthStore from '../store/useAuthStore';
import '../stylos/VendedorPOS.css';

export default function VendedorPOS() {
  const user = useAuthStore((s) => s.user);

  // Datos
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Formulario pedido
  const [clienteIdUsuario, setClienteIdUsuario] = useState('');
  const [sucursalId, setSucursalId] = useState('1');
  const [estado, setEstado] = useState('Entregado');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [observaciones, setObservaciones] = useState('');

  const total = useMemo(() => getTotal(), [cartItems]);

  // Carga de datos
  const loadProductos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/productos');
      setProductos(res.data || []);
    } catch (e) {
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClientesYSucursales = async () => {
    try {
      const [resCli, resSuc] = await Promise.all([
        api.get('/admin/clientes'),
        api.get('/admin/sucursales'),
      ]);
      setClientes(resCli.data || []);
      setSucursales(resSuc.data || []);
      const first = (resSuc.data || [])[0];
      if (first) setSucursalId(String(first.idSucursal));
    } catch (e) {
      // ignorar
    }
  };

  const reloadCart = () => setCartItems(getCart());

  useEffect(() => {
    loadProductos();
    loadClientesYSucursales();
    reloadCart();
    const onUpd = () => reloadCart();
    window.addEventListener('cart:updated', onUpd);
    return () => window.removeEventListener('cart:updated', onUpd);
  }, []);

  const filtered = productos.filter((p) =>
    (`${p.nombre || ''} ${p.descripcion || ''}`).toLowerCase().includes(q.toLowerCase())
  );

  const add = (p) => addToCart(p, 1);

  const handleCheckout = async () => {
    if (!user || Number(user.idRol) !== 2) {
      alert('Solo vendedores pueden registrar pedidos desde esta vista');
      return;
    }
    if (!clienteIdUsuario) {
      alert('Seleccioná un cliente');
      return;
    }
    const items = getCart();
    if (!items || items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const productosPayload = items.map((i) => ({
      idProducto: i.id,
      cantidad: i.quantity,
      precioUnitario: Number(i.product?.precio ?? i.product?.price ?? 0),
    }));

    const obs = `Pago: ${metodoPago}${observaciones ? ' | ' + observaciones : ''}`;

    const payload = {
      idCliente: Number(clienteIdUsuario),
      estado,
      idSucursalOrigen: Number(sucursalId || 1),
      productos: productosPayload,
      observaciones: obs,
    };

    try {
      setSubmitting(true);
      const res = await api.post('/admin/pedidos', payload);
      clearCart();
      reloadCart();
      alert(`Pedido creado (ID ${res.data?.idPedido || ''})`);
    } catch (e) {
      console.error(e);
      alert('No se pudo crear el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 6 }} className="vendedor-pos">
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
        Punto de Venta
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Elegí productos, asigná cliente y sucursal, y registrá el pedido con su forma de pago.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card className="pos-card" sx={{ mb: 2 }}>
            <CardContent>
              <TextField
                fullWidth
                size="medium"
                placeholder="Buscar productos por nombre o descripción..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </CardContent>
          </Card>

          {loading ? (
            <Typography>Cargando productos...</Typography>
          ) : (
            <Grid container spacing={2} className="products-grid">
              {filtered.map((p) => (
                <Grid item xs={12} sm={6} key={p.idProducto} className="product-item">
                  <Card className="pos-card product-card">
                    <CardContent>
                      <Typography variant="h6" className="product-title" sx={{ mb: 1 }}>
                        {p.nombre}
                      </Typography>
                      <Typography variant="body2" className="product-desc" sx={{ mb: 1.5, color: 'text.secondary' }}>
                        {p.descripcion}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        $ {Number(p.precio).toFixed(2)}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="medium"
                        startIcon={<AddShoppingCart />}
                        onClick={() => add(p)}
                        className="add-btn"
                      >
                        Agregar
                      </Button>
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
              <Typography variant="h6" sx={{ mb: 2 }}>
                Carrito
              </Typography>
              {cartItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Sin productos
                </Typography>
              ) : (
                <Box>
                  {cartItems.map((it) => (
                    <Box
                      key={it.id}
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{it.product?.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          $ {Number(it.product?.precio ?? it.product?.price ?? 0).toFixed(2)} x {it.quantity} = $ {getSubtotal(it).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" size="small" onClick={() => updateQuantity(it.id, Math.max(1, (it.quantity || 1) - 1))}>-
                        </Button>
                        <Typography sx={{ px: 1, lineHeight: '32px', minWidth: 24, textAlign: 'center' }}>
                          {it.quantity}
                        </Typography>
                        <Button variant="outlined" size="small" onClick={() => updateQuantity(it.id, (it.quantity || 1) + 1)}>+
                        </Button>
                        <Button variant="outlined" size="small" color="error" onClick={() => removeFromCart(it.id)}>
                          Quitar
                        </Button>
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
              <Typography variant="h6" sx={{ mb: 2 }}>
                Registrar pedido
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    size="medium"
                    options={clientes}
                    getOptionLabel={(c) => `${c?.nombre ?? ''} ${c?.apellido ?? ''}`.trim()}
                    onChange={(_, val) => setClienteIdUsuario(val ? String(val.idUsuario) : '')}
                    renderInput={(params) => <TextField {...params} label="Cliente" placeholder="Buscar cliente..." />}
                    isOptionEqualToValue={(o, v) => String(o.idUsuario) === String(v.idUsuario)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    size="medium"
                    options={sucursales}
                    getOptionLabel={(s) => s?.nombre ?? ''}
                    value={sucursales.find((s) => String(s.idSucursal) === String(sucursalId)) || null}
                    onChange={(_, val) => setSucursalId(val ? String(val.idSucursal) : '')}
                    renderInput={(params) => <TextField {...params} label="Sucursal" placeholder="Seleccione sucursal" />}
                    isOptionEqualToValue={(o, v) => String(o.idSucursal) === String(v.idSucursal)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="medium">
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
                  <FormControl fullWidth size="medium">
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
                  <TextField
                    fullWidth
                    size="medium"
                    label="Observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    multiline
                    minRows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button fullWidth variant="contained" size="large" disabled={submitting || cartItems.length === 0} onClick={handleCheckout}>
                    Crear pedido
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
 
