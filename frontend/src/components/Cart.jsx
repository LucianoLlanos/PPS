import React, { useState, useEffect } from 'react';
import * as ReactHooks from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateQuantity, removeFromCart, clearCart, getTotal, getSubtotal } from '../utils/cart';
import { formatCurrency, formatNumber } from '../utils/format';
import useAuthStore from '../store/useAuthStore';
import { OrdersAdminService } from '../services/OrdersAdminService';
import { OrdersClientService } from '../services/OrdersClientService';
import { CustomersService } from '../services/CustomersService';
import { SucursalesService } from '../services/SucursalesService';
import { ProductsService } from '../services/ProductsService';
import { StockService } from '../services/StockService';
import { ApiClient } from '../services/ApiClient';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Button, Card, CardContent, Grid, Avatar, Stack, Alert, Divider, FormControl, InputLabel, Select, MenuItem, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PersonAdd from '@mui/icons-material/PersonAdd';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productosStock, setProductosStock] = useState({}); // Mapa idProducto -> stock disponible
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Datos para flujo de vendedor
  const isSeller = !!user && Number(user.idRol) === 2;
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [clienteIdUsuario, setClienteIdUsuario] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [openNewClient, setOpenNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ nombre: '', apellido: '', telefono: '', direccion: '' });
  const [newClientEmail, setNewClientEmail] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientError, setClientError] = useState(null);
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
  const productsService = React.useMemo(() => new ProductsService(), []);
  const stockService = React.useMemo(() => new StockService(), []);
  const apiClient = React.useMemo(() => new ApiClient(), []);
  const printRef = ReactHooks.useRef(null);

  const [insufficientStock, setInsufficientStock] = useState([]);
  const [stockSucursalMap, setStockSucursalMap] = useState({});
  const [insufficientClient, setInsufficientClient] = useState([]);
  const [sellerStockMap, setSellerStockMap] = useState({});

  useEffect(() => {
    loadCart();
    const handleCartUpdate = () => {
      console.log('[Cart] Event cart:updated recibido, recargando carrito...');
      loadCart();
    };
    window.addEventListener('cart:updated', handleCartUpdate);
    return () => window.removeEventListener('cart:updated', handleCartUpdate);
  }, []);

  // Cargar stock disponible de los productos en el carrito
  useEffect(() => {
    const fetchStock = async () => {
      if (cartItems.length === 0) return;
      try {
        const productos = await productsService.listPublic();
        const stockMap = {};
        (Array.isArray(productos) ? productos : []).forEach(p => {
          stockMap[p.idProducto] = Number(p.stock || 0);
        });
        setProductosStock(stockMap);
      } catch (err) {
        console.error('Error obteniendo stock:', err);
      }
    };
    fetchStock();
  }, [cartItems.length, productsService]);

  // Cargar datos auxiliares para vendedor y cliente (sucursales y clientes en modo vendedor)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const promises = [];
        if (isSeller) {
          promises.push(customersService.list().catch(() => []));
        }
        // Siempre cargamos sucursales (también para clientes)
        promises.push(sucursalesService.list().catch(() => []));

        const results = await Promise.all(promises);
        const sucs = isSeller ? results[1] : results[0];
        const cli = isSeller ? (results[0] || []) : [];
        if (!mounted) return;
        setClientes(cli || []);
        setSucursales(sucs || []);
        if (!sucursalId && sucs && sucs.length > 0) setSucursalId(String(sucs[0].idSucursal));
      } catch {
        if (mounted) {
          setClientes([]);
          setSucursales([]);
        }
      }
    })();
    return () => { mounted = false; };
  }, [isSeller, customersService, sucursalesService]);

  // Validar stock por sucursal para cliente (no vendedor)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (isSeller) { setStockSucursalMap({}); setInsufficientClient([]); return; }
        const sucId = Number(sucursalId || 0);
        if (!sucId || !user || cartItems.length === 0) { setStockSucursalMap({}); setInsufficientClient([]); return; }
        // Traer productos con stock para esa sucursal
        const productos = await apiClient.get('/productos', { params: { idSucursal: sucId } });
        if (!mounted) return;
        const map = {};
        (Array.isArray(productos) ? productos : []).forEach(p => {
          const pid = Number(p.idProducto || p.id);
          if (!Number.isFinite(pid)) return;
          let available = 0;
          const lista = Array.isArray(p.stockPorSucursal) ? p.stockPorSucursal : [];
          const entry = lista.find(x => Number(x.idSucursal) === sucId);
          if (entry) available = Number(entry.stockDisponible || 0);
          map[pid] = available;
        });
        setStockSucursalMap(map);

        // Calcular insuficientes
        const insuff = [];
        for (const it of cartItems) {
          const prodId = Number(it.product?.idProducto || it.product?.id || it.id);
          const qty = Number(it.quantity || 1);
          const available = map[prodId] ?? 0;
          if (available < qty) {
            insuff.push({ id: prodId, nombre: it.product?.nombre || String(prodId), required: qty, available });
          }
        }
        setInsufficientClient(insuff);
      } catch (e) {
        console.warn('[Cart] no se pudo obtener stock por sucursal (cliente)', e);
        if (mounted) { setStockSucursalMap({}); setInsufficientClient([]); }
      }
    })();
    return () => { mounted = false; };
  }, [isSeller, user, sucursalId, cartItems, apiClient]);

  // Validar stock por sucursal para vendedor
  useEffect(() => {
    let mounted = true;
    const checkStock = async () => {
      try {
        if (!isSeller) return;
        const stockList = await stockService.listStockSucursal();
        if (!mounted) return;
        const sucId = Number(sucursalId || 0);
        if (!sucId) { setInsufficientStock([]); return; }
        const insuff = [];
        const map = {};
        for (const it of cartItems) {
          const prodId = Number(it.product?.idProducto || it.product?.id || it.id);
          const qty = Number(it.quantity || 1);
          const entry = (stockList || []).find(s => Number(s.idSucursal) === sucId && Number(s.idProducto) === prodId);
          const available = entry ? Number(entry.stockDisponible || 0) : 0;
          map[prodId] = available;
          if (available < qty) {
            insuff.push({ id: prodId, nombre: it.product?.nombre || String(prodId), required: qty, available });
          }
        }
        setInsufficientStock(insuff);
        setSellerStockMap(map);
      } catch (e) {
        console.warn('[Cart] no se pudo validar stock por sucursal', e);
        setInsufficientStock([]);
        setSellerStockMap({});
      }
    };
    checkStock();
    return () => { mounted = false; };
  }, [sucursalId, cartItems, isSeller, stockService]);

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
      console.log('[Cart] loadCart() ejecutado. Items en localStorage:', items);
      setCartItems(items || []);
    } catch (err) {
      console.error('[Cart] Error en loadCart:', err);
      setCartItems([]);
    }
  };

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) return;
    
    // Validar contra stock disponible (prioriza sucursal seleccionada en flujo cliente)
    let stockDisponible = productosStock[id] || 0;
    const pid = Number(id);
    if (sucursalId) {
      if (isSeller) {
        const porSucursalV = sellerStockMap[pid];
        if (porSucursalV !== undefined) stockDisponible = porSucursalV;
      } else {
        const porSucursal = stockSucursalMap[pid];
        if (porSucursal !== undefined) stockDisponible = porSucursal;
      }
    }
    if (newQuantity > stockDisponible) {
      alert(`Stock insuficiente. Disponible: ${stockDisponible}`);
      return;
    }
    
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
        totalConInteres: totalConAjustes,
        idSucursalOrigen: Number(sucursalId || 1)
      });
      const pedidoId = result.idPedido;
      clearCart();
      loadCart();
      // notify other views that product inventory may have changed
      try { window.dispatchEvent(new CustomEvent('products:refresh', { detail: { by: 'cart_checkout', productos: productos.map(p => p.idProducto) } })); } catch (e) {}
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
      console.debug('Respuesta create pedido (vendedor):', res);

      // intentar crear retiro (best-effort) si hay teléfono
      let codigoRetiro = null;
      let retiroError = null;
      try {
        const telefono = selectedCliente?.telefono || (newClient?.telefono) || null;
        if (telefono && pedidoId) {
          const retiroRes = await ordersAdminService.createRetiro(pedidoId, telefono);
          console.debug('Respuesta create retiro (vendedor):', retiroRes);
          codigoRetiro = retiroRes?.codigo || retiroRes?.code || retiroRes?.codigoRetiro || null;
          if (!codigoRetiro && retiroRes && retiroRes.idRetiro) codigoRetiro = retiroRes.idRetiro;
        }
      } catch (err) {
        console.warn('No se pudo crear código de retiro (vendedor):', err);
        retiroError = err?.response?.data || err?.message || String(err);
      }

      clearCart();
      loadCart();
      setOrderModal({ open: true, id: pedidoId, modo: 'vendedor', extra: { sucursal: sucursales.find(s => String(s.idSucursal) === String(sucursalId))?.nombre || '', codigoRetiro, retiroError } });
      // notify other views that product inventory may have changed
      try { window.dispatchEvent(new CustomEvent('products:refresh', { detail: { by: 'pos_checkout', productos: productosPayload.map(p => p.idProducto) } })); } catch (e) {}
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

  // Helpers sucursal -> dirección y horarios
  const getSucursalMeta = (nombre) => {
    const n = String(nombre || '').toLowerCase();
    const isNorte = n.includes('norte');
    const isCentro = n.includes('centro') || n.includes('sentro');
    const isSur = n.includes('sur');
    let direccion = 'Dirección a confirmar';
    if (isNorte) direccion = 'Av. Francisco de Aguirre 2421';
    else if (isCentro) direccion = 'Bernardo de Monteagudo 247';
    else if (isSur) direccion = 'Av. Independencia 1794';
    const horarios = 'Lunes a sábados: 08:00 a 18:00';
    return { direccion, horarios };
  };

  const getSucursalNombreActual = () => {
    const s = (sucursales || []).find(x => String(x.idSucursal) === String(sucursalId));
    return s?.nombre || '';
  };

  const handleDownloadImage = async () => {
    try {
      const node = printRef.current;
      if (!node) return;
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `pedido-${orderModal.id || 'confirmacion'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.warn('No se pudo descargar imagen', e);
      alert('No se pudo descargar la imagen.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const node = printRef.current;
      if (!node) return;
      const imgData = await toPng(node, { cacheBust: true, pixelRatio: 2 });
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Create an image to get its dimensions
      const image = new Image();
      image.src = imgData;
      await new Promise((res) => { image.onload = res; });
      const imgW = image.width;
      const imgH = image.height;
      const ratio = Math.min(pageWidth / imgW, pageHeight / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
      const x = (pageWidth - w) / 2;
      const y = 36; // small top margin
      pdf.addImage(imgData, 'PNG', x, y, w, h);
      pdf.save(`pedido-${orderModal.id || 'confirmacion'}.pdf`);
    } catch (e) {
      console.warn('No se pudo descargar PDF', e);
      alert('No se pudo descargar el PDF.');
    }
  };

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
                      {sucursalId ? (() => {
                        const pid = Number(product.idProducto || product.id || item.id);
                        const available = isSeller ? (sellerStockMap[pid] ?? 0) : (stockSucursalMap[pid] ?? 0);
                        const over = Number(item.quantity) > Number(available);
                        return (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }} color={over ? 'error.main' : 'text.secondary'}>
                            Disponible en sucursal seleccionada: {available}
                          </Typography>
                        );
                      })() : null}
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
          <Card className="cart-summary-card" sx={{
            borderRadius: 0,
            border: '1px solid #e5e9ef',
            position: { md: 'sticky' },
            top: { md: 24 },
            // Forzar nueva capa de composición para evitar render borroso en algunos navegadores
            transform: { md: 'translateZ(0)' },
            willChange: { md: 'transform, opacity' },
            backfaceVisibility: { md: 'hidden' }
          }}>
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
                    <InputLabel>Sucursal</InputLabel>
                    <Select 
                      label="Sucursal" 
                      value={sucursalId}
                      onChange={(e) => setSucursalId(String(e.target.value))}
                      MenuProps={{ disableScrollLock: true }}
                    >
                      {(sucursales || []).map(s => (
                        <MenuItem key={s.idSucursal} value={String(s.idSucursal)}>{s.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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

                  {insufficientClient && insufficientClient.length > 0 ? (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      La sucursal seleccionada no tiene stock suficiente para {insufficientClient.length} producto(s): {insufficientClient.map(i => `${i.nombre} (necesita ${i.required}, disponible ${i.available})`).join(', ')}. Ajustá cantidades o cambiá la sucursal.
                    </Alert>
                  ) : null}
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
                  <Button sx={{ borderRadius: 0, py: 1.2, fontWeight: 800 }} variant={user ? 'contained' : 'outlined'} color={user ? 'success' : 'primary'} fullWidth onClick={handleCheckout} disabled={loading || (insufficientClient && insufficientClient.length > 0)}>{loading ? 'Procesando...' : (user ? 'Hacer Pedido' : 'Iniciar sesión para pedir')}</Button>
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
                          value={selectedCliente || (clientes.find(c => String(c.idUsuario) === String(clienteIdUsuario)) || null)}
                          getOptionLabel={(c) => `${c?.nombre ?? ''} ${c?.apellido ?? ''}`.trim()}
                          onChange={(_, val) => { setClienteIdUsuario(val ? String(val.idUsuario) : ''); setSelectedCliente(val || null); }}
                          renderInput={(params) => <TextField {...params} label="Cliente" placeholder="Buscar cliente..." />}
                          isOptionEqualToValue={(o, v) => String(o.idUsuario) === String(v.idUsuario)}
                        />
                        <Box sx={{ mt: 1 }}>
                          <Button size="small" variant="contained" onClick={() => setOpenNewClient(true)} startIcon={<PersonAdd />}>Nuevo cliente</Button>
                        </Box>
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
                    {insufficientStock && insufficientStock.length > 0 ? (
                      <Grid item xs={12}>
                        <Alert severity="warning">La sucursal seleccionada no tiene stock suficiente para {insufficientStock.length} producto(s): {insufficientStock.map(i => `${i.nombre} (necesita ${i.required}, disponible ${i.available})`).join(', ')}. Ajustá cantidades o cambiá la sucursal.</Alert>
                      </Grid>
                    ) : null}
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
                        <Button variant="contained" color="primary" fullWidth sx={{ borderRadius: 0 }} onClick={handleSellerCheckout} disabled={loading || !clienteIdUsuario || cartItems.length === 0 || (insufficientStock && insufficientStock.length > 0)}>{loading ? 'Procesando...' : 'Crear pedido'}</Button>
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
            <Box ref={printRef} sx={{ p: 0.5 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>¡Gracias por tu compra!</Typography>
              <Typography sx={{ mb: 2 }}>Tu pedido fue procesado correctamente.</Typography>
              <Typography variant="body2" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
                Número de pedido: <strong>{orderModal.id}</strong><br />
                Presenta este número o tu nombre al momento de retirar y pagar en la sucursal.
              </Typography>
              <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Detalles de retiro</Typography>
                {(() => {
                  const nombre = getSucursalNombreActual();
                  const meta = getSucursalMeta(nombre);
                  return (
                    <>
                      <Typography variant="body2">Sucursal: <strong>{nombre || 'N/D'}</strong></Typography>
                      <Typography variant="body2">Dirección: <strong>{meta.direccion}</strong></Typography>
                      <Typography variant="body2">Horarios: <strong>{meta.horarios}</strong></Typography>
                    </>
                  );
                })()}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display:'block' }}>
                Te enviaremos actualizaciones del estado si corresponde.
              </Typography>
            </Box>
          )}
          {orderModal.modo === 'vendedor' && (
            <Box ref={printRef}>
              <Typography variant="h6" sx={{ mb: 1 }}>Pedido cargado en caja</Typography>
              <Typography sx={{ mb: 2 }}>El pedido se registró correctamente para el cliente seleccionado.</Typography>
              <Typography variant="body2" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
                ID Pedido: <strong>{orderModal.id}</strong><br />
                Sucursal: <strong>{orderModal.extra?.sucursal || 'N/D'}</strong><br />
                {orderModal.extra?.codigoRetiro ? (
                  <span>Código de retiro: <strong>{orderModal.extra.codigoRetiro}</strong><br /></span>
                ) : null}
                El cliente puede retirarlo presentando el número o su nombre.
              </Typography>
              <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Detalles de retiro</Typography>
                {(() => {
                  const nombre = orderModal.extra?.sucursal || getSucursalNombreActual();
                  const meta = getSucursalMeta(nombre);
                  return (
                    <>
                      <Typography variant="body2">Sucursal: <strong>{nombre || 'N/D'}</strong></Typography>
                      <Typography variant="body2">Dirección: <strong>{meta.direccion}</strong></Typography>
                      <Typography variant="body2">Horarios: <strong>{meta.horarios}</strong></Typography>
                    </>
                  );
                })()}
              </Box>
              {orderModal.extra?.retiroError ? (
                <Box sx={{ mt: 1 }}><Alert severity="warning">No se pudo generar código de retiro: {typeof orderModal.extra.retiroError === 'string' ? orderModal.extra.retiroError : JSON.stringify(orderModal.extra.retiroError)}</Alert></Box>
              ) : null}
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
          {(orderModal.modo === 'cliente' || orderModal.modo === 'vendedor') && (
            <>
              <Button onClick={handleDownloadPDF} variant="outlined">Descargar PDF</Button>
              <Button onClick={handleDownloadImage} variant="outlined">Descargar imagen</Button>
            </>
          )}
          {orderModal.modo !== 'error' && (
            <Button onClick={() => { setOrderModal({ open: false, id: null, modo: 'cliente', extra: null }); navigate('/'); }} variant="contained" color="primary">Cerrar</Button>
          )}
          {orderModal.modo === 'error' && (
            <Button onClick={() => setOrderModal({ open: false, id: null, modo: 'cliente', extra: null })} variant="contained">Entendido</Button>
          )}
        </DialogActions>
      </Dialog>
    
      {/* Dialog para crear cliente rápido (vendedor) */}
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
            const created = res?.cliente || res;
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
          } finally { setCreatingClient(false); }
        }}>Crear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}