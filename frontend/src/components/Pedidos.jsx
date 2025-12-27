import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrdersAdminService } from '../services/OrdersAdminService';
import { SucursalesService } from '../services/SucursalesService';
import { UsersAdminService } from '../services/UsersAdminService';
import { ProductsService } from '../services/ProductsService';
import { formatCurrency } from '../utils/format';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Snackbar, Select, MenuItem, InputLabel, FormControl, IconButton, Tooltip, Popover, Chip, Stack, Divider, InputAdornment, Skeleton
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getStatusInfo } from '../utils/statusColors';
import StatusPill from './StatusPill';

// Small helper: compact preview for products column
function ProductListPreview({ productos = [] }) {
  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);
  const visible = productos.slice(0, 2);
  const more = productos.length - visible.length;
  return (
    <>
      <Box sx={{ width: '100%', p: 0, m: 0, background: 'transparent', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: (productos || []).length > 2 ? 'flex-start' : 'center', gap: 0 }}>
        {visible.map((prod, i) => (
          <Box key={i} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0, minWidth: 0, width: '100%', p: 0, lineHeight: 1.15 }} title={`${prod.nombre} (x${prod.cantidad})`}>
            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', display: '-webkit-box', fontWeight: 600, fontSize: '0.88rem', flex: 1, minWidth: 0, pr: 1 }}>{prod.nombre}</Typography>
            <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', px: 0.4, py: '2px', borderRadius: 10, fontWeight: 700, fontSize: '0.72rem', flex: '0 0 auto' }}>x{prod.cantidad}</Box>
          </Box>
        ))}
        {more > 0 && (
          <Button size="small" onClick={(e) => setAnchor(e.currentTarget)} sx={{ mt: 0.25, textTransform: 'none', fontSize: '0.78rem', p: 0, minWidth: 0, alignSelf: 'flex-start' }}>+{more} más</Button>
        )}
      </Box>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableScrollLock
        PaperProps={{ sx: { p: 1.5, minWidth: 240, borderRadius: 2, boxShadow: '0 14px 34px rgba(15,23,42,0.12)' } }}
      >
        <Box sx={{ maxWidth: 420 }}>
          {productos.slice(visible.length).map((pr, i) => (
            <Box key={i} sx={{ py: 0.5, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
              <Typography variant="body1" sx={{ pr: 2, flex: 1, fontSize: '0.92rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>{pr.nombre}</Typography>
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', px: 0.6, py: '4px', borderRadius: 14, fontWeight: 700, fontSize: '0.78rem', ml: 1 }}>x{pr.cantidad}</Box>
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
}

function QuantitySummary({ productos = [] }) {
  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);
  const total = (productos || []).reduce((s, p) => s + Number(p.cantidad || 0), 0);
  const distinct = (productos || []).length;
  const label = `${total} unidad${total !== 1 ? 'es' : ''} · ${distinct} producto${distinct !== 1 ? 's' : ''}`;
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button onClick={(e) => setAnchor(e.currentTarget)} sx={{ textTransform: 'none', p: 0, minWidth: 0 }} aria-label={`Ver detalle de ${distinct} productos`}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>{total}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{`${distinct} producto${distinct !== 1 ? 's' : ''}`}</Typography>
          </Box>
        </Button>
      </Box>
      <Popover open={open} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} disableScrollLock>
        <Box sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Detalle de cantidades</Typography>
          {(productos || []).map((pr, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
              <Typography variant="body1" sx={{ color: 'text.primary' }}>{pr.nombre}</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>x{pr.cantidad}</Typography>
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
}

function Pedidos() {
  const navigate = useNavigate();
  const ordersService = useMemo(() => new OrdersAdminService(), []);
  const sucursalesService = useMemo(() => new SucursalesService(), []);
  const usersService = useMemo(() => new UsersAdminService(), []);
  const productsService = useMemo(() => new ProductsService(), []);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  // filtros por columna
  const [filterId, setFilterId] = useState('');
  const [filterProducto, setFilterProducto] = useState('');
  const [filterUsuario, setFilterUsuario] = useState('');
  const [filterCantidadMin, setFilterCantidadMin] = useState('');
  const [filterCantidadMax, setFilterCantidadMax] = useState('');
  const [filterFechaFrom, setFilterFechaFrom] = useState('');
  const [filterFechaTo, setFilterFechaTo] = useState('');
  const [filterTotalMin, setFilterTotalMin] = useState('');
  const [filterTotalMax, setFilterTotalMax] = useState('');
  // Por defecto mostrar sólo pedidos pendientes en la vista
  const DEFAULT_ESTADO = 'Pendiente';
  const [filterEstado, setFilterEstado] = useState(DEFAULT_ESTADO);
  const [filterMetodoPago, setFilterMetodoPago] = useState('');
  const [error, setError] = useState(null);
  // fieldErrors eliminado porque no se usa actualmente
  const [deletePedido, setDeletePedido] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [addPedido, setAddPedido] = useState(false);
  const [addForm, setAddForm] = useState({ usuario: '', productos: [], estado: 'Pendiente', sucursal: '', fecha: '', total: '', metodoPago: 'Efectivo', cuotas: 1, interes: 0 });
  const [addFormErrors, setAddFormErrors] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [productosList, setProductosList] = useState([]);
  const [exporting, setExporting] = useState(false);

  const loadingStartRef = useRef(0);
  const tableRef = useRef(null);
  const scrollBoxRef = useRef(null);
  const _colgroupTimer = useRef(null);
  const MIN_LOADING_MS = 300; // ms minimal visible time for skeletons to avoid flicker
  const finishLoading = () => {
    try {
      const elapsed = Date.now() - (loadingStartRef.current || 0);
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  // Colgroup locking disabled: allow browser to distribute column widths automatically
  // This avoids forcing narrow column widths that produced the vertical letter-wrapping.

  // Normalize estado values coming from backend (various casings/keys) into UI labels
  function normalizeEstado(v) {
    if (v == null) return v;
    const ESTADO_MAP = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      preparando: 'En Proceso',
      'en_proceso': 'En Proceso',
      'en proceso': 'En Proceso',
      enviado: 'Enviado',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };
    const key = String(v).trim().toLowerCase();
    return ESTADO_MAP[key] || (key.charAt(0).toUpperCase() + key.slice(1));
  }

  // Extraer método de pago desde observaciones si metodoPago no está presente
  const extractMetodoFromObservaciones = (obs) => {
    try {
      if (!obs) return null;
      const m = String(obs).match(/Pago:\s*([^|\n\r]+)/i);
      if (m && m[1]) return m[1].trim();
      return null;
    } catch {
      return null;
    }
  };

  // Carga inicial de datos (pedidos, sucursales, usuarios, productos)
  // scroll syncing external scrollbar removed — use native scrollbar in the scroll box

    useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        loadingStartRef.current = Date.now();
        setLoading(true);
        const [listPedidos, listSucursales, listUsuarios, listProductos] = await Promise.all([
          ordersService.list().catch(() => []),
          sucursalesService.list().catch(() => []),
          usersService.list().catch(() => []),
          productsService.listAdmin().catch(() => []),
        ]);
        if (!mounted) return;
        const normalized = Array.isArray(listPedidos) ? (listPedidos || []).map(p => ({ ...p, estado: normalizeEstado(p.estado) })) : [];
        setPedidos(normalized);
        setSucursales(Array.isArray(listSucursales) ? listSucursales : []);
        setUsuarios(Array.isArray(listUsuarios) ? listUsuarios : []);
        setProductosList(Array.isArray(listProductos) ? listProductos : []);
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar los datos');
      } finally {
        finishLoading();
      }
    };
    load();
    return () => { mounted = false; };
    }, [ordersService, sucursalesService, usersService, productsService]);

  const clearFilters = () => {
    setFilterId(''); setFilterProducto(''); setFilterUsuario(''); setFilterCantidadMin(''); setFilterCantidadMax(''); setFilterFechaFrom(''); setFilterFechaTo(''); setFilterTotalMin(''); setFilterTotalMax(''); setFilterEstado(DEFAULT_ESTADO); setFilterMetodoPago('');
    // After clearing, refresh the table to the default estado (Pendiente)
    // use override to avoid waiting for state update
    applyFiltersToServer({ estado: DEFAULT_ESTADO });
  };

  // Apply filters by requesting the server with the selected params
  // accepts optional overrides (e.g. { estado: 'ALL' }) to allow immediate application
  const applyFiltersToServer = async (overrides = {}) => {
    const params = {};
    try {
      if (filterId) params.idPedido = filterId;
      if (filterProducto) params.producto = filterProducto;
      if (filterUsuario) params.usuario = filterUsuario;
      if (filterCantidadMin) params.cantidadMin = filterCantidadMin;
      if (filterCantidadMax) params.cantidadMax = filterCantidadMax;
      if (filterFechaFrom) params.fechaDesde = filterFechaFrom;
      if (filterFechaTo) params.fechaHasta = filterFechaTo;
      if (filterTotalMin) params.totalMin = filterTotalMin;
      if (filterTotalMax) params.totalMax = filterTotalMax;
      if (filterMetodoPago) params.metodoPago = filterMetodoPago;

      const effectiveEstado = overrides.estado !== undefined ? overrides.estado : filterEstado;
      // Estado: map UI 'ALL' to a value the backend recognizes as request for all
      if (effectiveEstado && effectiveEstado !== 'ALL') {
        params.estado = effectiveEstado;
      } else if (effectiveEstado === 'ALL') {
        params.estado = 'all';
      }

      loadingStartRef.current = Date.now();
      setLoading(true);
      const refreshed = await ordersService.list(params);
      const normalized = Array.isArray(refreshed) ? (refreshed || []).map(p => ({ ...p, estado: normalizeEstado(p.estado) })) : [];
      setPedidos(normalized);
      closeFilters();
    } catch (e) {
      console.error('Error aplicando filtros:', e);
      setError('No se pudieron aplicar los filtros');
    } finally {
      finishLoading();
    }
  };

  // When the user changes Estado in the filters popover we want to apply immediately
  const handleFilterEstadoChange = async (e) => {
    const v = e.target.value;
    setFilterEstado(v);
    // apply immediately using the provided value (avoid relying on state update timing)
    try {
      await applyFiltersToServer({ estado: v });
    } catch (err) {
      // applyFiltersToServer handles error logging
    }
  };
 

  // Popover para filtros
  const [filtersAnchor, setFiltersAnchor] = useState(null);
  const openFilters = (e) => setFiltersAnchor(e.currentTarget);
  const closeFilters = () => setFiltersAnchor(null);

  // Active filters summary (used by the UI chips)
  const activeFilters = [];
  if (filterId) activeFilters.push({ key: 'ID', val: filterId });
  if (filterProducto) activeFilters.push({ key: 'Producto', val: filterProducto });
  if (filterUsuario) activeFilters.push({ key: 'Usuario', val: filterUsuario });
  if (filterCantidadMin || filterCantidadMax) activeFilters.push({ key: 'Cant', val: `${filterCantidadMin || '-'}..${filterCantidadMax || '-'}` });
  const formatFilterDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('es-AR'); } catch { return d; } };
  if (filterFechaFrom || filterFechaTo) activeFilters.push({ key: 'Fecha', val: `${formatFilterDate(filterFechaFrom)}..${formatFilterDate(filterFechaTo)}` });
  if (filterTotalMin || filterTotalMax) activeFilters.push({ key: 'Total', val: `${filterTotalMin || '-'}..${filterTotalMax || '-'}` });
  if (filterEstado) activeFilters.push({ key: 'Estado', val: filterEstado === 'ALL' ? 'Todos' : filterEstado });
  if (filterMetodoPago) activeFilters.push({ key: 'Pago', val: filterMetodoPago });

  // Lista visible después de aplicar filtros
  const displayedPedidos = (pedidos || []).filter(p => {
    // Estado
    if (filterEstado && filterEstado !== 'ALL') {
      if ((p.estado || '') !== filterEstado) return false;
    }
    if (filterId) {
      const idMatch = String(p.idPedido || '').includes(filterId);
      // also try other common number fields that may be used as 'otro numero'
      const retiroCodes = [];
      if (p.retiro) {
        retiroCodes.push(p.retiro.codigo || p.retiro.code || p.retiro.idRetiro || '');
      }
      const otherFields = [p.numeroPedido, p.numero, p.numeroOrden, p.codigoPedido, p.referencia, p.numeroReferencia].concat(retiroCodes);
      const otherMatch = otherFields.some(f => f != null && String(f).includes(filterId));
      if (!idMatch && !otherMatch) return false;
    }
    if (filterProducto) {
      const found = (p.productos || []).some(prod => (prod.nombre || '').toLowerCase().includes(filterProducto.toLowerCase()));
      if (!found) return false;
    }
    if (filterUsuario) {
      const full = ((p.nombreUsuario || '') + ' ' + (p.apellidoUsuario || '')).toLowerCase();
      if (!full.includes(filterUsuario.toLowerCase())) return false;
    }
    if (filterCantidadMin || filterCantidadMax) {
      const totalCant = (p.productos || []).reduce((s, pr) => s + Number(pr.cantidad || 0), 0);
      if (filterCantidadMin && totalCant < Number(filterCantidadMin)) return false;
      if (filterCantidadMax && totalCant > Number(filterCantidadMax)) return false;
    }
    if (filterFechaFrom) {
      const from = new Date(filterFechaFrom);
      if (new Date(p.fecha) < from) return false;
    }
    if (filterFechaTo) {
      const to = new Date(filterFechaTo);
      to.setHours(23,59,59,999);
      if (new Date(p.fecha) > to) return false;
    }
    if (filterMetodoPago) {
      const metodo = (p.metodoPago || 'No especificado').toLowerCase();
      if (!metodo.includes(filterMetodoPago.toLowerCase())) return false;
    }
    if (filterTotalMin && Number(p.total) < Number(filterTotalMin)) return false;
    if (filterTotalMax && Number(p.total) > Number(filterTotalMax)) return false;
    return true;
  });

  // Construir filas para exportación a partir de una lista de pedidos
  const buildExportRows = (rows) => {
    return (rows || []).map((p) => {
      const totalUnidades = (p.productos || []).reduce((s, it) => s + Number(it.cantidad || 0), 0);
      const productosResumen = (p.productos || []).map(pr => `${pr.nombre} x${pr.cantidad}`).join(' | ');
      const d = p.fecha ? new Date(p.fecha) : null;
      const fechaStr = d ? d.toLocaleDateString('es-AR') : '';
      const horaStr = d ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '';
      const metodoFromObs = extractMetodoFromObservaciones(p.observaciones);
      const metodoRaw = p.metodoPago && String(p.metodoPago).trim() ? String(p.metodoPago).trim() : (metodoFromObs || 'No especificado');
      const cuotasTxt = p.cuotas && Number(p.cuotas) > 1 ? `${p.cuotas} cuotas` : '';
      const interesTxt = p.interes && Number(p.interes) > 0 ? `${p.interes}% int.` : '';
      const descuentoTxt = p.descuento && Number(p.descuento) > 0 ? `${p.descuento}% desc.` : '';
      const pagoDetalle = [metodoRaw, cuotasTxt, interesTxt || descuentoTxt].filter(Boolean).join(' · ');
      return {
        ID: p.idPedido,
        Productos: productosResumen,
        Usuario: `${p.nombreUsuario || ''} ${p.apellidoUsuario || ''}`.trim(),
        Unidades: totalUnidades,
        Fecha: `${fechaStr} ${horaStr}`.trim(),
        Pago: pagoDetalle,
        Total: Number(p.totalConInteres || p.total || 0),
        Estado: p.estado || 'Pendiente'
      };
    });
  };

  const exportToPDF = async (useDisplayed = true) => {
    try {
      setExporting(true);
      const rows = buildExportRows(useDisplayed ? displayedPedidos : pedidos);
      const doc = new jsPDF('p', 'pt', 'a4');
      const title = `Pedidos (${useDisplayed ? 'según filtros' : 'todos'})`;
      doc.setFontSize(14);
      doc.text(title, 40, 40);
      const head = [['ID', 'Productos', 'Usuario', 'Unidades', 'Fecha', 'Pago', 'Total', 'Estado']];
      const body = rows.map(r => [r.ID, r.Productos, r.Usuario, String(r.Unidades), r.Fecha, r.Pago, formatCurrency(r.Total), r.Estado]);
      autoTable(doc, { head, body, startY: 60, styles: { fontSize: 10, cellPadding: 4 }, headStyles: { fillColor: [240,240,240] } });
      doc.save(`pedidos_${useDisplayed ? 'filtros' : 'todos'}.pdf`);
    } catch (e) {
      console.warn('Export PDF error', e);
      setError('No se pudo exportar a PDF');
    } finally { setExporting(false); }
  };

  const exportToExcel = async (useDisplayed = true) => {
    try {
      setExporting(true);
      const rows = buildExportRows(useDisplayed ? displayedPedidos : pedidos);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
      XLSX.writeFile(wb, `pedidos_${useDisplayed ? 'filtros' : 'todos'}.xlsx`);
    } catch (e) {
      console.warn('Export Excel error', e);
      setError('No se pudo exportar a Excel');
    } finally { setExporting(false); }
  };

  // Helpers para renderizar estados (chips / items)
  const renderStatusValue = (value) => <StatusPill value={value} variant="inline" />;

  const renderStatusMenuItem = (value, label) => {
    return (
      <MenuItem value={value} key={value} sx={{ my: 0.25 }}>
        <StatusPill value={value} label={label} />
      </MenuItem>
    );
  };


  const confirmDelete = async () => {
    if (!deletePedido) return;
    try {
      await ordersService.remove(deletePedido.idPedido).catch(() => null);
      setPedidos(prev => prev.filter(p => p.idPedido !== deletePedido.idPedido));
      setDeletePedido(null);
      setSuccess('Pedido eliminado');
      setOpenSnackbar(true);
    } catch (e) {
      console.error(e);
      setDeleteError('No se pudo eliminar el pedido');
    }
  };

  // Abre el modal de confirmación para eliminar
  const handleDelete = (pedido) => {
    setDeletePedido(pedido);
    setDeleteError(null);
  };

  // Cambia el estado del pedido en el backend y actualiza la lista local
  const handleEstado = async (pedido, nuevoEstado) => {
    try {
      await ordersService.update(pedido.idPedido, { estado: nuevoEstado });
      setPedidos(prev => prev.map(p => (p.idPedido === pedido.idPedido ? { ...p, estado: nuevoEstado } : p)));
      setSuccess('Estado actualizado');
      setOpenSnackbar(true);
    } catch (err) {
      console.error('Error actualizando estado:', err);
      setError('No se pudo actualizar el estado');
    }
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    try {
      // validar filas (producto seleccionado y precio > 0)
      const rows = addForm.productos || [];
      const rowErrors = rows.map((r) => ({ producto: !r.idProducto, precio: !(Number(r.precioUnitario) > 0) }));
      const hasRowErrors = rowErrors.some(re => re.producto || re.precio);
      setAddFormErrors(rowErrors);
      if (hasRowErrors) { setError('Corrige los productos y precios (precio debe ser mayor a 0)'); return; }
      // Validaciones mínimas
      if (!addForm.usuario) { setError('Seleccioná un usuario'); return; }
      if (!addForm.sucursal) { setError('Seleccioná una sucursal'); return; }
      if (!addForm.productos || addForm.productos.length === 0) { setError('Agregá al menos un producto'); return; }

      // Construir productos con precioUnitario a partir de productosList
      const productosPayload = addForm.productos.map((pr) => {
        const found = productosList.find(p => String(p.idProducto) === String(pr.idProducto));
        const defaultPrecio = Number(found?.precio ?? found?.price ?? 0) || 0;
        const precioUnitario = pr.precioUnitario != null && Number(pr.precioUnitario) > 0 ? Number(pr.precioUnitario) : defaultPrecio;
        return {
          idProducto: Number(pr.idProducto),
          cantidad: Number(pr.cantidad || 1),
          precioUnitario
        };
      });

      const subtotal = productosPayload.reduce((s, it) => s + (it.cantidad * it.precioUnitario), 0);
      // calcular porcentajes según método/cuotas
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

      const interesPercent = getInteresFor(addForm.metodoPago, Number(addForm.cuotas || 1));
      const descuentoPercent = getDescuentoFor(addForm.metodoPago);
      const montoInteres = subtotal * (interesPercent / 100);
      const montoDescuento = subtotal * (descuentoPercent / 100);
      const totalConInteres = subtotal + montoInteres - montoDescuento;

      const payload = {
        idCliente: Number(addForm.usuario),
        estado: addForm.estado,
        idSucursalOrigen: Number(addForm.sucursal),
        productos: productosPayload,
        fecha: addForm.fecha || new Date().toISOString(),
        total: subtotal,
        metodoPago: addForm.metodoPago,
        cuotas: Number(addForm.cuotas || 1),
        interes: interesPercent,
        descuento: descuentoPercent,
        totalConInteres: totalConInteres
      };

      // Enviar al backend y refrescar la lista real desde el servidor
      const postRes = await ordersService.create(payload);
      if (postRes) {
        try {
          const refreshed = await ordersService.list();
          const normalized = Array.isArray(refreshed) ? (refreshed || []).map(p => ({ ...p, estado: normalizeEstado(p.estado) })) : [];
          setPedidos(normalized);
        } catch (e) {
          // no bloquear si falla el refresh
          console.error('Error refrescando pedidos después de crear:', e);
        }
        setAddPedido(false);
        setAddForm({ usuario: '', productos: [], estado: 'Pendiente', sucursal: '', fecha: '', total: '', metodoPago: 'Efectivo', cuotas: 1, interes: 0 });
        setError(null);
        setSuccess('Pedido creado');
        setOpenSnackbar(true);
      } else {
        setError('No se pudo crear el pedido');
      }
    } catch (err) {
      console.error('Error creando pedido:', err);
      const msg = err?.response?.data?.error || 'No se pudo crear el pedido';
      setError(msg.toString());
    }
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    // si cambia el metodo de pago y no es tarjeta, forzar cuotas a 1
    if (name === 'metodoPago') {
      const metodo = value;
      if (metodo !== 'Tarjeta de crédito') {
        setAddForm(prev => ({ ...prev, [name]: value, cuotas: 1, interes: 0 }));
        return;
      }
    }
    // convertir cuotas a número
    if (name === 'cuotas') {
      setAddForm(prev => ({ ...prev, [name]: Number(value) }));
      return;
    }
    setAddForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProductoChange = (index, field, value) => {
    setAddForm(prev => {
      const productos = Array.isArray(prev.productos) ? [...prev.productos] : [];
      productos[index] = { ...productos[index], [field]: value };
      // si se cambió el producto, prefill precioUnitario con el precio del producto seleccionado
      if (field === 'idProducto') {
        const found = productosList.find(p => String(p.idProducto) === String(value));
        const precio = found ? (Number(found?.precio ?? found?.price ?? 0) || 0) : '';
        productos[index].precioUnitario = precio;
      }
      // si se cambió el precioUnitario manualmente, convertir a número
      if (field === 'precioUnitario') {
        productos[index].precioUnitario = value === '' ? '' : Number(value);
      }
      return { ...prev, productos };
    });
  };

  const removeProductoRow = (index) => {
    setAddForm(prev => ({ ...prev, productos: prev.productos.filter((_, i) => i !== index) }));
  };

  const addProductoRow = () => {
    setAddForm(prev => ({ ...prev, productos: [...(prev.productos || []), { idProducto: '', cantidad: 1, precioUnitario: '' }] }));
  };

  return (
    <Box sx={{ width: '100%', py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>Pedidos</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
            <TextField
              size="small"
              placeholder="Nº pedido"
              value={filterId}
              onChange={e => setFilterId(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyFiltersToServer(); }}
              sx={{ width: 120 }}
              InputProps={{ endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => applyFiltersToServer()}>
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) }}
            />
          </Box>
          <Button
            startIcon={<FilterListIcon />}
            variant="outlined"
            size="small"
            onClick={openFilters}
            sx={{
              textTransform: 'none',
              borderRadius: 999,
              px: 1.5,
              py: 0.6,
              fontWeight: 600,
              color: '#0f172a',
              borderColor: '#e6edf3',
              background: 'linear-gradient(180deg,#ffffff,#fbfdff)',
              boxShadow: '0 6px 14px rgba(2,6,23,0.06)',
              '&:hover': { background: 'linear-gradient(180deg,#f1f5f9,#eef2ff)' }
            }}
          >
            Filtros
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            color="success"
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 0.78,
              boxShadow: '0 8px 18px rgba(16,185,129,0.16)',
              '&:hover': { boxShadow: '0 10px 22px rgba(16,185,129,0.22)' }
            }}
            onClick={() => setAddPedido(true)}
          >
            Registrar pedido
          </Button>
          <Button variant="outlined" size="small" onClick={() => exportToPDF(true)} disabled={exporting} sx={{ textTransform: 'none' }}>Exportar PDF</Button>
          <Button variant="outlined" size="small" onClick={() => exportToExcel(true)} disabled={exporting} sx={{ textTransform: 'none' }}>Exportar Excel</Button>
        </Stack>
      </Box>
      {activeFilters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1}>
            {activeFilters.map((f, i) => (
              <Chip key={i} label={`${f.key}: ${f.val}`} size="small" onDelete={() => {
                if (f.key === 'ID') setFilterId('');
                if (f.key === 'Producto') setFilterProducto('');
                if (f.key === 'Usuario') setFilterUsuario('');
                if (f.key === 'Cant') { setFilterCantidadMin(''); setFilterCantidadMax(''); }
                if (f.key === 'Fecha') { setFilterFechaFrom(''); setFilterFechaTo(''); }
                if (f.key === 'Total') { setFilterTotalMin(''); setFilterTotalMax(''); }
                if (f.key === 'Estado') {
                  setFilterEstado(DEFAULT_ESTADO);
                  // refresh server to default estado immediately
                  applyFiltersToServer({ estado: DEFAULT_ESTADO });
                }
                if (f.key === 'Pago') setFilterMetodoPago('');
              }} />
            ))}
          </Stack>
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>}
      <TableContainer component={Paper} sx={{ position: 'relative', borderRadius: 4, boxShadow: '0 18px 40px rgba(15,23,42,0.08)', maxWidth: '100%', background: 'linear-gradient(180deg,#ffffff,#fbfcfd)', display: 'flex', flexDirection: 'column', height: { xs: '80vh', md: '72vh', lg: '75vh' }, pr: 0 }}>
        {/* loading UI: render inline skeleton rows inside the table body to avoid overlays and layout shifts */}
        <Box ref={scrollBoxRef} sx={{ overflowX: 'auto', overflowY: 'auto', flex: 1, scrollbarGutter: 'stable', pr: 0, pl: 0, width: '100%', ml: 0 }}>
        <Table stickyHeader ref={tableRef} sx={{ width: '100%', tableLayout: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui', background: 'transparent',
          // allow cells to shrink to avoid forcing horizontal scroll
          '& th, & td': { minWidth: 0 },
          // Header: keep header labels on a single line to avoid vertical letter-wrapping
          '& .MuiTableHead-root .MuiTableCell-root': { py: 0.75, px: 1.25, boxSizing: 'border-box', height: 'auto', minHeight: 'auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
            // Body: force fixed height so rows don't jump (adjusted to leave space for '+N más')
            '& .MuiTableBody-root .MuiTableRow-root': { boxSizing: 'border-box', height: 88, maxHeight: 88 },
            // Body cells: keep single line with ellipsis to avoid vertical accordion effect
            '& .MuiTableBody-root .MuiTableCell-root': { py: 1, px: 1, boxSizing: 'border-box', height: 88, minHeight: 88, maxHeight: 88, overflow: 'hidden', verticalAlign: 'middle', display: 'table-cell', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
            // Exception: allow Productos column to wrap/multi-line if needed
            '& .productos-cell': { whiteSpace: 'normal', wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis' },
            // Prevent content-driven width changes: default to ellipsis and break-word as fallback
            '& td, & th': { boxSizing: 'border-box', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }
          }}>
          <TableHead sx={{ position: 'sticky', top: 0, zIndex: 5 }}>
        <TableRow sx={{ background: 'linear-gradient(180deg,#ffffff 0%, #f3f6f9 100%)', borderBottom: '2px solid #e5e7eb', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.9rem', letterSpacing: 0.5, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 1, px: 1.5, borderTopLeftRadius: 14, width: 84, textAlign: 'center' }} className="tnum num-right">ID</TableCell>
              <TableCell className="productos-cell" sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.95rem', letterSpacing: 0.6, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 0.9, px: 1, width: '24%', minWidth: 120, textAlign: 'left', verticalAlign: 'middle', whiteSpace: 'normal' }}>Productos</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.9rem', letterSpacing: 0.5, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 1, px: 1, width: '18%', minWidth: 100, textAlign: 'center' }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.9rem', letterSpacing: 0.5, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 1, px: 1, width: 80, minWidth: 64, textAlign: 'center' }}>Unidades</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.9rem', letterSpacing: 0.5, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 1, px: 1, minWidth: 100, textAlign: 'center' }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.9rem', letterSpacing: 0.5, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 1, px: 1, minWidth: 110, textAlign: 'center' }}>Forma de Pago</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.9rem', letterSpacing: 0.5, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 1, px: 1, width: 140, minWidth: 100, textAlign: 'right' }} className="tnum num-right">Total</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.9rem', letterSpacing: 0.5, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 1, px: 1, width: 140, minWidth: 120, textAlign: 'center' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.9rem', letterSpacing: 0.5, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 1, px: 1, width: 90, borderTopRightRadius: 14, textAlign: 'center' }}>Acciones</TableCell>
            </TableRow>
            {/* filtros ahora en popover */}
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} sx={{ height: 88, boxSizing: 'border-box', backgroundColor: i % 2 === 0 ? '#fff' : '#f7f8fa', borderBottom: '1px solid #e6e9ec' }}>
                  <TableCell sx={{ py: 1, px: 1, width: 64, textAlign: 'center', boxSizing: 'border-box' }} className="tnum num-right"><Skeleton variant="text" width={24} /></TableCell>
                  <TableCell sx={{ py: 1.25, px: 1, minWidth: 220, width: '36%', boxSizing: 'border-box' }}><Skeleton variant="text" width="70%" /></TableCell>
                  <TableCell sx={{ py: 1, px: 1, width: '20%', minWidth: 120, textAlign: 'center', boxSizing: 'border-box' }}><Skeleton variant="text" width="60%" /></TableCell>
                  <TableCell sx={{ py: 1, px: 1, textAlign: 'center', width: 64 }}><Skeleton variant="text" width={30} /></TableCell>
                  <TableCell sx={{ py: 1, px: 1, textAlign: 'center' }}><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell sx={{ py: 1, px: 1, textAlign: 'center' }}><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell sx={{ py: 1.2, px: 2, textAlign: 'right' }} className="tnum num-right"><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell sx={{ py: 1.2, px: 2 }}><Skeleton variant="text" width={120} /></TableCell>
                  <TableCell sx={{ py: 1, px: 1, width: 110 }}><Skeleton variant="rectangular" width={36} height={36} /></TableCell>
                </TableRow>
              ))
            ) : (
              displayedPedidos.map((p, idx) => (
                <TableRow key={p.idPedido} hover sx={{ height: 88, boxSizing: 'border-box', backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f8fa', transition: loading ? 'none' : 'background 0.2s', '&:hover': loading ? {} : { background: 'rgba(15,23,42,0.035)' }, borderBottom: '1px solid #e6e9ec' }}>
                  {/* si hay >1 producto alineamos arriba para evitar que la lista quede centrada y desplace el ID */}
                  <TableCell sx={{ py: 1, px: 1, width: 64, textAlign: 'center', boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: (p.productos || []).length > 2 ? 'flex-start' : 'center' }} className="tnum num-right">{p.idPedido}</TableCell>
                  <TableCell sx={{ py: 1.25, pr: 0.75, pl: 1, minWidth: 140, width: '26%', position: 'relative', boxSizing: 'border-box', overflow: 'hidden', verticalAlign: 'middle', background: 'transparent !important' }}>
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: (p.productos || []).length > 2 ? 'flex-start' : 'center', justifyContent: 'flex-start', p: 0, m: 0, background: 'transparent' }}>
                      <ProductListPreview productos={p.productos || []} />
                    </Box>
                    {p.retiro ? (
                      <Tooltip title={`Tel: ${p.retiro.telefono || '-'} • Creado: ${p.retiro.createdAt ? new Date(p.retiro.createdAt).toLocaleString('es-AR') : '-'}`}>
                        <Chip
                          variant="outlined"
                          label={p.retiro.codigo || p.retiro.code || p.retiro.idRetiro || '-'}
                          size="small"
                          color="info"
                          clickable
                          onClick={() => navigate(`/pedidos/${p.idPedido}`)}
                          aria-label={`Retiro ${p.retiro.codigo || ''}`}
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            right: '12%',
                            transform: 'none',
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                            borderColor: 'rgba(14,165,233,0.18)',
                            color: 'info.dark',
                            maxWidth: 110,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: 600,
                            fontSize: '0.66rem',
                            zIndex: 8,
                            padding: '1px 6px'
                          }}
                        />
                      </Tooltip>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 1, width: '20%', minWidth: 120, textAlign: 'center', boxSizing: 'border-box' }}>{p.nombreUsuario} {p.apellidoUsuario}</TableCell>
                  <TableCell sx={{ py: 1, px: 1, textAlign: 'center', width: 64 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{(p.productos || []).reduce((s, it) => s + Number(it.cantidad || 0), 0)}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>unidades</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 1, textAlign: 'center' }}>
                    {(() => {
                      const d = p.fecha ? new Date(p.fecha) : null;
                      const dateStr = d ? d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                      const timeStr = d ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '';
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{dateStr}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{timeStr}</Typography>
                        </Box>
                      );
                    })()}
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 1, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {(() => {
                        const metodoFromObs = extractMetodoFromObservaciones(p.observaciones);
                        const metodoRaw = p.metodoPago && String(p.metodoPago).trim() ? String(p.metodoPago).trim() : metodoFromObs;
                        const cuotasN = p.cuotas != null ? Number(p.cuotas) : null;
                        const interesN = p.interes != null ? Number(p.interes) : null;
                        const descuentoN = p.descuento != null ? Number(p.descuento) : null;
                        if (!metodoRaw && !cuotasN && !descuentoN) return <Typography variant="body2" sx={{ fontWeight: 600 }}>No especificado</Typography>;
                        return (
                          <>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{metodoRaw}</Typography>
                            {cuotasN && cuotasN > 1 ? (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{`${cuotasN} cuotas${interesN && interesN > 0 ? ` (${interesN}% int.)` : ''}`}</Typography>
                            ) : null}
                            {descuentoN && descuentoN > 0 ? (
                              <Typography variant="caption" sx={{ color: 'success.main' }}>{`${descuentoN}% desc.`}</Typography>
                            ) : null}
                          </>
                        );
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.2, px: 2 }} className="tnum num-right">{formatCurrency(Number(p.totalConInteres || p.total || 0))}</TableCell>
                  <TableCell sx={{ py: 1.2, px: 2 }}>
                    <FormControl size="small" sx={{ width: 160, minWidth: 160 }}>
                      <Select
                        value={p.estado || 'Pendiente'}
                        onChange={e => handleEstado(p, e.target.value)}
                        renderValue={renderStatusValue}
                        disabled={loading}
                        MenuProps={{
                          disableScrollLock: true,
                          MenuListProps: { dense: true },
                          PaperProps: { sx: { borderRadius: 2, boxShadow: '0 14px 34px rgba(15,23,42,0.18)', px: 1, py: 1 } }
                        }}
                        sx={{
                          '.MuiOutlinedInput-notchedOutline': { borderColor: 'transparent !important' },
                          '.MuiSelect-select': { py: 0.6, display: 'flex', alignItems: 'center' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent !important' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent !important' },
                          '.MuiSelect-icon': { color: '#6b7280' }
                        }}
                      >
                        {renderStatusMenuItem('Pendiente', 'Pendiente')}
                        {renderStatusMenuItem('En Proceso', 'En Proceso')}
                        {renderStatusMenuItem('Enviado', 'Enviado')}
                        {renderStatusMenuItem('Entregado', 'Entregado')}
                        {renderStatusMenuItem('Cancelado', 'Cancelado')}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 1, width: 110, display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="Ver detalle">
                      <IconButton color="primary" size="small" onClick={() => navigate(`/pedidos/${p.idPedido}`)} sx={{ ml: 0 }} edge="end">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar pedido">
                      <IconButton color="error" size="small" onClick={() => handleDelete(p)} sx={{ ml: 0 }} edge="end">
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </Box>

        {/* native scrollbar is used inside the scroll box */}
      </TableContainer>

      <Popover open={!!filtersAnchor} anchorEl={filtersAnchor} onClose={closeFilters} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} disableScrollLock>
        <Box sx={{ p: 2, width: 420 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Filtros</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <TextField size="small" label="ID" value={filterId} onChange={e => setFilterId(e.target.value)} />
            <TextField size="small" label="Producto" value={filterProducto} onChange={e => setFilterProducto(e.target.value)} />
            <TextField size="small" label="Usuario" value={filterUsuario} onChange={e => setFilterUsuario(e.target.value)} />
            <FormControl size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterEstado}
                onChange={handleFilterEstadoChange}
                label="Estado"
                renderValue={(v) => {
                  if (!v || v === 'ALL') return (
                    <Chip
                      label="Todos"
                      size="small"
                      color="default"
                      sx={{
                        fontWeight: 700,
                        borderRadius: 8,
                        px: 1.2,
                        py: 0.4,
                        transition: 'transform 140ms ease, box-shadow 140ms ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(2,6,23,0.08)' }
                      }}
                    />
                  );
                  return renderStatusValue(v);
                }}
                MenuProps={{ disableScrollLock: true }}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="ALL">
                  <Chip
                    label="Todos"
                    size="small"
                    color="default"
                    sx={{ fontWeight: 700, borderRadius: 8, px: 1.2, py: 0.4, transition: 'transform 140ms ease' }}
                  />
                </MenuItem>
                {renderStatusMenuItem('Pendiente', 'Pendiente')}
                {renderStatusMenuItem('En Proceso', 'En Proceso')}
                {renderStatusMenuItem('Enviado', 'Enviado')}
                {renderStatusMenuItem('Entregado', 'Entregado')}
                {renderStatusMenuItem('Cancelado', 'Cancelado')}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Método de pago</InputLabel>
              <Select value={filterMetodoPago} onChange={e => setFilterMetodoPago(e.target.value)} label="Método de pago" MenuProps={{ disableScrollLock: true }}>
                <MenuItem value="">(todos)</MenuItem>
                <MenuItem value="Efectivo">Efectivo</MenuItem>
                <MenuItem value="Tarjeta de crédito">Tarjeta de crédito</MenuItem>
                <MenuItem value="Tarjeta de débito">Tarjeta de débito</MenuItem>
                <MenuItem value="Transferencia">Transferencia</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" label="Cant. min" value={filterCantidadMin} onChange={e => setFilterCantidadMin(e.target.value)} />
            <TextField size="small" label="Cant. max" value={filterCantidadMax} onChange={e => setFilterCantidadMax(e.target.value)} />
            <TextField type="date" size="small" label="Fecha desde" InputLabelProps={{ shrink: true }} value={filterFechaFrom} onChange={e => setFilterFechaFrom(e.target.value)} helperText={filterFechaFrom ? new Date(filterFechaFrom).toLocaleDateString('es-AR') : ''} />
            <TextField type="date" size="small" label="Fecha hasta" InputLabelProps={{ shrink: true }} value={filterFechaTo} onChange={e => setFilterFechaTo(e.target.value)} helperText={filterFechaTo ? new Date(filterFechaTo).toLocaleDateString('es-AR') : ''} />
            <TextField size="small" label="Total min" value={filterTotalMin} onChange={e => setFilterTotalMin(e.target.value)} />
            <TextField size="small" label="Total max" value={filterTotalMax} onChange={e => setFilterTotalMax(e.target.value)} />
          </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Button size="small" onClick={clearFilters}>Limpiar</Button>
            <Button size="small" variant="contained" onClick={applyFiltersToServer}>Aplicar</Button>
          </Box>
        </Box>
      </Popover>

      {/* Modal Alta */}
      <Dialog open={addPedido} onClose={() => setAddPedido(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>Registrar Pedido</DialogTitle>
        <DialogContent sx={{ overflowX: 'hidden', overflowY: 'auto', maxHeight: '72vh', boxSizing: 'border-box', scrollbarGutter: 'stable' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submitAdd} noValidate sx={{ mt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Usuario</InputLabel>
              <Select name="usuario" value={addForm.usuario} onChange={handleAddChange} required label="Usuario" MenuProps={{ disableScrollLock: true }}>
                <MenuItem value="">Selecciona usuario (solo clientes)</MenuItem>
                {usuarios.filter(u => u.nombreRol && u.nombreRol.toLowerCase() === 'cliente').map(u => (
                  <MenuItem key={u.idUsuario} value={u.idUsuario}>{u.nombre} {u.apellido} ({u.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sucursal</InputLabel>
              <Select name="sucursal" value={addForm.sucursal} onChange={handleAddChange} required label="Sucursal" MenuProps={{ disableScrollLock: true }}>
                <MenuItem value="">Selecciona sucursal</MenuItem>
                {sucursales.map(s => (
                  <MenuItem key={s.idSucursal} value={s.idSucursal}>{s.nombre} ({s.direccion})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Forma de pago</InputLabel>
              <Select name="metodoPago" value={addForm.metodoPago} onChange={handleAddChange} required label="Forma de pago" MenuProps={{ disableScrollLock: true }}>
                <MenuItem value="Efectivo">Efectivo</MenuItem>
                <MenuItem value="Tarjeta de crédito">Tarjeta de crédito</MenuItem>
                <MenuItem value="Tarjeta de débito">Tarjeta de débito</MenuItem>
                <MenuItem value="Transferencia">Transferencia</MenuItem>
              </Select>
            </FormControl>

            {addForm.metodoPago === 'Tarjeta de crédito' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Cuotas</InputLabel>
                <Select name="cuotas" value={addForm.cuotas} onChange={handleAddChange} label="Cuotas" MenuProps={{ disableScrollLock: true }}>
                  <MenuItem value={1}>1 cuota (0% interés)</MenuItem>
                  <MenuItem value={3}>3 cuotas (10% interés)</MenuItem>
                  <MenuItem value={6}>6 cuotas (15% interés)</MenuItem>
                  <MenuItem value={9}>9 cuotas (20% interés)</MenuItem>
                  <MenuItem value={12}>12 cuotas (30% interés)</MenuItem>
                </Select>
              </FormControl>
            )}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Productos</Typography>
              {addForm.productos.map((prod, idx) => {
                const found = productosList.find(p => String(p.idProducto) === String(prod.idProducto));
                const catalogPrice = Number(found?.precio ?? found?.price ?? 0);
                const effectivePrice = (prod.precioUnitario != null && prod.precioUnitario > 0) ? prod.precioUnitario : (catalogPrice || 0);
                const isModified = prod.precioUnitario != null && prod.precioUnitario > 0 && prod.precioUnitario !== catalogPrice;
                const lineTotal = effectivePrice * Number(prod.cantidad || 0);
                return (
                  <Box key={idx} sx={{
                    display: 'grid',
                    gridTemplateColumns: '16px minmax(120px, 1fr) 72px 1fr 100px 44px',
                    gridTemplateRows: 'auto auto',
                    gap: '6px 8px',
                    alignItems: 'start',
                    minHeight: 56,
                    mb: 1.2,
                    p: 0,
                    borderLeft: isModified ? '3px solid rgba(245,158,11,0.22)' : '1px solid transparent',
                    backgroundColor: isModified ? 'rgba(255,248,230,0.45)' : 'transparent',
                    transition: 'background-color 200ms, border-left-color 200ms'
                  }}>
                    {/* indicador pequeño en columna fija */}
                    <Box sx={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gridRow: 1 }}>
                      {isModified ? <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'rgba(245,158,11,0.95)', boxShadow: '0 0 0 6px rgba(245,158,11,0.06)' }} /> : null}
                    </Box>
                    {/* Select en la fila superior */}
                    <FormControl sx={{ minWidth: 120, gridRow: 1 }} size="small" error={!!(addFormErrors[idx] && addFormErrors[idx].producto)}>
                      <InputLabel>Producto</InputLabel>
                      <Select
                        value={prod.idProducto}
                        onChange={e => handleProductoChange(idx, 'idProducto', e.target.value)}
                        required
                        label="Producto"
                        MenuProps={{ disableScrollLock: true }}
                        renderValue={(v) => {
                          const sel = productosList.find(pr => String(pr.idProducto) === String(v));
                          const text = sel ? sel.nombre : 'Producto';
                          return (
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={text}>{text}</span>
                          );
                        }}
                        sx={{ '.MuiSelect-select': { py: 0, display: 'flex', alignItems: 'center', height: 40, pr: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, '.MuiSelect-icon': { right: 8 } }}
                      >
                        <MenuItem value="">Producto</MenuItem>
                        {productosList.map(pr => (
                          <MenuItem key={pr.idProducto} value={pr.idProducto} title={pr.nombre} sx={{ whiteSpace: 'normal' }}>{pr.nombre}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField type="number" size="small" label="Cant." value={prod.cantidad} inputProps={{ min: 1 }} onChange={e => handleProductoChange(idx, 'cantidad', Number(e.target.value))} required sx={{ width: 72, gridRow: 1, '& .MuiInputBase-root': { height: 40, display: 'flex', alignItems: 'center' } }} />
                    {/* Precio editable (fila superior) */}
                    <Box sx={{ width: '100%', maxWidth: 140, gridRow: 1 }}>
                      <TextField
                        type="number"
                        size="small"
                        label={isModified ? 'Precio (mod.)' : 'Precio'}
                        value={prod.precioUnitario === '' || prod.precioUnitario == null ? '' : prod.precioUnitario}
                        inputProps={{ min: 0, step: '0.01' }}
                        onChange={e => handleProductoChange(idx, 'precioUnitario', e.target.value)}
                        sx={{ width: '100%', borderRadius: 1, backgroundColor: isModified ? 'rgba(255,243,205,0.45)' : 'transparent', '& .MuiInputBase-root': { height: 40, display: 'flex', alignItems: 'center' }, '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 }, '& input[type=number]': { MozAppearance: 'textfield' } }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          endAdornment: isModified ? (
                            <InputAdornment position="end">
                              <Tooltip title={`Catálogo: ${formatCurrency(catalogPrice)}`} arrow>
                                <IconButton size="small" sx={{ p: 0.3 }} aria-label="catálogo">
                                  <InfoOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </InputAdornment>
                          ) : null
                        }}
                        error={!!(addFormErrors[idx] && addFormErrors[idx].precio)}
                      />
                    </Box>
                    {/* Total por producto (fila superior) */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gridRow: 1 }}>
                      <Typography variant="caption" color="text.secondary">Total</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(lineTotal || 0)}</Typography>
                    </Box>
                    <Button variant="outlined" color="error" size="small" sx={{ borderRadius: 999, minWidth: 36, px: 0.8, alignSelf: 'center', ml: 3, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gridRow: 1 }} onClick={() => removeProductoRow(idx)}>
                      ✖
                    </Button>

                    {/* Segunda fila: nombre completo y tooltip de catálogo */}
                    <Box sx={{ gridColumn: '2 / 6', gridRow: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0 }}>{found?.nombre || '\u00A0'}</Typography>
                      {isModified ? (
                        <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600, ml: 0.5 }}>Modificado</Typography>
                      ) : null}
                    </Box>
                    {/* catalog icon moved into the price field endAdornment; second-row icon removed */}
                  </Box>
                );
              })}
              <Button variant="outlined" color="primary" size="small" sx={{ borderRadius: 999, mt: 1, px: 2 }} onClick={addProductoRow}>
                ＋ Agregar producto
              </Button>
            
              {/* Resumen simple (usar overrides de precio) */}
              <Box sx={{ mt: 1.5, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, bg: 'background.paper' }}>
                {(() => {
                  const productosCalc = (addForm.productos || []).map(pr => {
                    const found = productosList.find(p => String(p.idProducto) === String(pr.idProducto));
                    const catalogPrice = Number(found?.precio ?? found?.price ?? 0);
                    const precio = (pr.precioUnitario != null && pr.precioUnitario > 0) ? Number(pr.precioUnitario) : catalogPrice;
                    const cantidad = Number(pr.cantidad || 0);
                    return { precio, cantidad, subtotal: precio * cantidad, nombre: found?.nombre || '' };
                  });
                  const subtotal = productosCalc.reduce((s, it) => s + it.subtotal, 0);
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
                  const interesPercent = getInteresFor(addForm.metodoPago, Number(addForm.cuotas || 1));
                  const descuentoPercent = getDescuentoFor(addForm.metodoPago);
                  const montoInteres = subtotal * (interesPercent / 100);
                  const montoDescuento = subtotal * (descuentoPercent / 100);
                  const totalConInteres = subtotal + montoInteres - montoDescuento;
                  const valorPorCuota = (addForm.metodoPago === 'Tarjeta de crédito' && Number(addForm.cuotas || 1) > 1) ? (totalConInteres / Number(addForm.cuotas || 1)) : 0;
                  return (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Subtotal</Typography>
                        <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
                      </Box>
                      {descuentoPercent > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main', mb: 0.5 }}>
                          <Typography variant="body2">Descuento ({descuentoPercent}%)</Typography>
                          <Typography variant="body2">-{formatCurrency(montoDescuento)}</Typography>
                        </Box>
                      )}
                      {interesPercent > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'warning.main', mb: 0.5 }}>
                          <Typography variant="body2">Interés ({interesPercent}%)</Typography>
                          <Typography variant="body2">+{formatCurrency(montoInteres)}</Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Total</Typography>
                        <Typography variant="h6">{formatCurrency(totalConInteres)}</Typography>
                      </Box>
                      {valorPorCuota > 0 && (
                        <Typography variant="caption" color="text.secondary">{Number(addForm.cuotas)} cuotas de {formatCurrency(valorPorCuota)}</Typography>
                      )}
                    </Box>
                  );
                })()}
              </Box>
            </Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Estado</InputLabel>
              <Select name="estado" value={addForm.estado} onChange={handleAddChange} required label="Estado" renderValue={renderStatusValue} MenuProps={{ disableScrollLock: true }}>
                {renderStatusMenuItem('Pendiente', 'Pendiente')}
                {renderStatusMenuItem('En Proceso', 'En Proceso')}
                {renderStatusMenuItem('Enviado', 'Enviado')}
                {renderStatusMenuItem('Entregado', 'Entregado')}
                {renderStatusMenuItem('Cancelado', 'Cancelado')}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button type="submit" variant="contained" color="primary" sx={{ borderRadius: 999, px: 3, fontWeight: 600 }}>Registrar pedido</Button>
              <Button
                type="button"
                variant="outlined"
                startIcon={<ClearIcon sx={{ color: 'error.main' }} />}
                sx={{
                  borderRadius: 2,
                  px: 2.5,
                  py: 0.6,
                  textTransform: 'none',
                  color: 'error.main',
                  borderColor: 'error.main',
                  '&:hover': { backgroundColor: 'rgba(244,67,54,0.06)', borderColor: 'error.dark' }
                }}
                onClick={() => setAddPedido(false)}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal Borrado */}
      <Dialog open={!!deletePedido} onClose={() => { setDeletePedido(null); setDeleteError(null); }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>¿Eliminar pedido?</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <Typography>¿Estás seguro que quieres eliminar el pedido <b>#{deletePedido?.idPedido}</b>? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="error" sx={{ borderRadius: 999, px: 3 }} onClick={confirmDelete}>Eliminar</Button>
          <Button variant="outlined" color="secondary" sx={{ borderRadius: 999, px: 3 }} onClick={() => { setDeletePedido(null); setDeleteError(null); }}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Pedidos;
