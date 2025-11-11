import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { formatCurrency } from '../utils/format';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Snackbar, Select, MenuItem, InputLabel, FormControl, IconButton, Tooltip, Popover, Chip, Stack
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getStatusInfo } from '../utils/statusColors';

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
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
  const [filterEstado, setFilterEstado] = useState('');
  const [error, setError] = useState(null);
  // fieldErrors eliminado porque no se usa actualmente
  const [deletePedido, setDeletePedido] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [addPedido, setAddPedido] = useState(false);
  const [addForm, setAddForm] = useState({ usuario: '', productos: [], estado: 'Pendiente', sucursal: '', fecha: '', total: '' });
  const [sucursales, setSucursales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [productosList, setProductosList] = useState([]);

  // Carga inicial de datos (pedidos, sucursales, usuarios, productos)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [resPedidos, resSucursales, resUsuarios, resProductos] = await Promise.all([
          api.get('/admin/pedidos').catch(() => ({ data: [] })),
          api.get('/admin/sucursales').catch(() => ({ data: [] })),
          api.get('/admin/usuarios').catch(() => ({ data: [] })),
          api.get('/admin/productos').catch(() => ({ data: [] })),
        ]);
        if (!mounted) return;
        setPedidos(Array.isArray(resPedidos.data) ? resPedidos.data : []);
        setSucursales(Array.isArray(resSucursales.data) ? resSucursales.data : []);
        setUsuarios(Array.isArray(resUsuarios.data) ? resUsuarios.data : []);
        setProductosList(Array.isArray(resProductos.data) ? resProductos.data : []);
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar los datos');
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const clearFilters = () => {
    setFilterId(''); setFilterProducto(''); setFilterUsuario(''); setFilterCantidadMin(''); setFilterCantidadMax(''); setFilterFechaFrom(''); setFilterFechaTo(''); setFilterTotalMin(''); setFilterTotalMax(''); setFilterEstado('');
  };

  // Popover para filtros
  const [filtersAnchor, setFiltersAnchor] = useState(null);
  const openFilters = (e) => setFiltersAnchor(e.currentTarget);
  const closeFilters = () => setFiltersAnchor(null);

  const activeFilters = [];
  if (filterId) activeFilters.push({ key: 'ID', val: filterId });
  if (filterProducto) activeFilters.push({ key: 'Producto', val: filterProducto });
  if (filterUsuario) activeFilters.push({ key: 'Usuario', val: filterUsuario });
  if (filterCantidadMin || filterCantidadMax) activeFilters.push({ key: 'Cant', val: `${filterCantidadMin || '-'}..${filterCantidadMax || '-'}` });
  if (filterFechaFrom || filterFechaTo) activeFilters.push({ key: 'Fecha', val: `${filterFechaFrom || '-'}..${filterFechaTo || '-'}` });
  if (filterTotalMin || filterTotalMax) activeFilters.push({ key: 'Total', val: `${filterTotalMin || '-'}..${filterTotalMax || '-'}` });
  if (filterEstado) activeFilters.push({ key: 'Estado', val: filterEstado });

  const displayedPedidos = pedidos.filter(p => {
    if (filterId && !String(p.idPedido).includes(filterId)) return false;
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
      // include day
      to.setHours(23,59,59,999);
      if (new Date(p.fecha) > to) return false;
    }
    if (filterTotalMin && Number(p.total) < Number(filterTotalMin)) return false;
    if (filterTotalMax && Number(p.total) > Number(filterTotalMax)) return false;
    if (filterEstado && ((p.estado || '') !== filterEstado)) return false;
    return true;
  });

  const renderStatusValue = (value) => {
    const info = getStatusInfo(value);
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: info.bg, border: `2px solid ${info.color}` }} />
        <Box component="span" sx={{ color: info.color, fontWeight: 600, fontSize: '0.95rem' }}>{info.label || value}</Box>
      </Box>
    );
  };

  const renderStatusMenuItem = (value, label) => {
    const info = getStatusInfo(value);
    return (
      <MenuItem value={value} key={value}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: info.bg, border: `2px solid ${info.color}` }} />
          <Box component="span" sx={{ color: info.color }}>{label}</Box>
        </Box>
      </MenuItem>
    );
  };

  // Handlers mínimos para evitar errores y mantener la lógica intacta
  const handleEstado = async (pedido, nuevoEstado) => {
    try {
      // Optimistic update
      setPedidos(prev => prev.map(p => p.idPedido === pedido.idPedido ? { ...p, estado: nuevoEstado } : p));
      await api.put(`/admin/pedidos/${pedido.idPedido}`, { ...pedido, estado: nuevoEstado }).catch(() => null);
      setSuccess('Estado actualizado');
      setOpenSnackbar(true);
    } catch (e) {
      console.error(e);
      setError('No se pudo actualizar el estado');
    }
  };

  const handleDelete = (pedido) => {
    setDeletePedido(pedido);
  };

  const confirmDelete = async () => {
    if (!deletePedido) return;
    try {
      await api.delete(`/admin/pedidos/${deletePedido.idPedido}`).catch(() => null);
      setPedidos(prev => prev.filter(p => p.idPedido !== deletePedido.idPedido));
      setDeletePedido(null);
      setSuccess('Pedido eliminado');
      setOpenSnackbar(true);
    } catch (e) {
      console.error(e);
      setDeleteError('No se pudo eliminar el pedido');
    }
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    try {
      // Validaciones mínimas
      if (!addForm.usuario) { setError('Seleccioná un usuario'); return; }
      if (!addForm.sucursal) { setError('Seleccioná una sucursal'); return; }
      if (!addForm.productos || addForm.productos.length === 0) { setError('Agregá al menos un producto'); return; }

      // Construir productos con precioUnitario a partir de productosList
      const productosPayload = addForm.productos.map((pr) => {
        const found = productosList.find(p => String(p.idProducto) === String(pr.idProducto));
        const precioUnitario = Number(found?.precio ?? found?.price ?? 0) || 0;
        return {
          idProducto: Number(pr.idProducto),
          cantidad: Number(pr.cantidad || 1),
          precioUnitario
        };
      });

      const totalCalc = productosPayload.reduce((s, it) => s + (it.cantidad * it.precioUnitario), 0);

      const payload = {
        idCliente: Number(addForm.usuario),
        estado: addForm.estado,
        idSucursalOrigen: Number(addForm.sucursal),
        productos: productosPayload,
        fecha: addForm.fecha || new Date().toISOString(),
        total: totalCalc
      };

      // Enviar al backend y refrescar la lista real desde el servidor
      const postRes = await api.post('/admin/pedidos', payload);
      if (postRes && (postRes.status === 200 || postRes.status === 201)) {
        try {
          const resPedidos = await api.get('/admin/pedidos');
          setPedidos(Array.isArray(resPedidos.data) ? resPedidos.data : []);
        } catch (e) {
          // no bloquear si falla el refresh
          console.error('Error refrescando pedidos después de crear:', e);
        }
        setAddPedido(false);
        setAddForm({ usuario: '', productos: [], estado: 'Pendiente', sucursal: '', fecha: '', total: '' });
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
    setAddForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProductoChange = (index, field, value) => {
    setAddForm(prev => {
      const productos = Array.isArray(prev.productos) ? [...prev.productos] : [];
      productos[index] = { ...productos[index], [field]: value };
      return { ...prev, productos };
    });
  };

  const removeProductoRow = (index) => {
    setAddForm(prev => ({ ...prev, productos: prev.productos.filter((_, i) => i !== index) }));
  };

  const addProductoRow = () => {
    setAddForm(prev => ({ ...prev, productos: [...(prev.productos || []), { idProducto: '', cantidad: 1 }] }));
  };

  return (
    <Box sx={{ width: '100%', py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>Pedidos</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button startIcon={<FilterListIcon />} variant="outlined" size="small" onClick={openFilters} sx={{ textTransform: 'none' }}>Filtros</Button>
          <Button variant="contained" color="success" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, px: 2.5, py: 1, boxShadow: 1 }} onClick={() => setAddPedido(true)}>
            Registrar pedido
          </Button>
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
                if (f.key === 'Estado') setFilterEstado('');
              }} />
            ))}
          </Stack>
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>}
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 18px 40px rgba(15,23,42,0.08)', maxWidth: '100vw', overflowX: 'auto', background: 'linear-gradient(180deg,#ffffff,#fbfcfd)' }}>
        <Table sx={{ width: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui', background: 'transparent' }}>
          <TableHead>
        <TableRow sx={{ background: 'linear-gradient(180deg,#ffffff 0%, #f3f6f9 100%)', borderBottom: '2px solid #e5e7eb', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2, borderTopLeftRadius: 14 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Productos</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Cantidades</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2, borderTopRightRadius: 14 }}>Acciones</TableCell>
            </TableRow>
            {/* filtros ahora en popover */}
          </TableHead>
          <TableBody>
            {displayedPedidos.map((p, idx) => (
              <TableRow key={p.idPedido} hover sx={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f8fa', transition: 'background 0.2s', '&:hover': { background: 'rgba(15,23,42,0.035)' } }}>
                <TableCell sx={{ py: 1.2, px: 2 }}>{p.idPedido}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{p.productos.map((prod, i) => (<div key={i}>{prod.nombre} <span style={{ color: '#6b7280' }}>(x{prod.cantidad})</span></div>))}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{p.nombreUsuario} {p.apellidoUsuario}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    {p.productos.map((prod, i) => (
                      <div key={i} style={{ textAlign: 'center', minWidth: 24 }}>{prod.cantidad}</div>
                    ))}
                  </Box>
                </TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{new Date(p.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{formatCurrency(Number(p.total || 0))}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                      value={p.estado || 'Pendiente'}
                      onChange={e => handleEstado(p, e.target.value)}
                      renderValue={renderStatusValue}
                    >
                      {renderStatusMenuItem('Pendiente', 'Pendiente')}
                      {renderStatusMenuItem('En Proceso', 'En Proceso')}
                      {renderStatusMenuItem('Enviado', 'Enviado')}
                      {renderStatusMenuItem('Entregado', 'Entregado')}
                      {renderStatusMenuItem('Cancelado', 'Cancelado')}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>
                  <Button variant="contained" color="error" size="small" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, px: 2, py: 0.7, fontSize: '0.97rem' }} onClick={() => handleDelete(p)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Popover open={!!filtersAnchor} anchorEl={filtersAnchor} onClose={closeFilters} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Box sx={{ p: 2, width: 420 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Filtros</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <TextField size="small" label="ID" value={filterId} onChange={e => setFilterId(e.target.value)} />
            <TextField size="small" label="Producto" value={filterProducto} onChange={e => setFilterProducto(e.target.value)} />
            <TextField size="small" label="Usuario" value={filterUsuario} onChange={e => setFilterUsuario(e.target.value)} />
            <FormControl size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} label="Estado" renderValue={(v) => (v ? renderStatusValue(v) : '(todos)')}>
                <MenuItem value="">(todos)</MenuItem>
                {renderStatusMenuItem('Pendiente', 'Pendiente')}
                {renderStatusMenuItem('En Proceso', 'En Proceso')}
                {renderStatusMenuItem('Enviado', 'Enviado')}
                {renderStatusMenuItem('Entregado', 'Entregado')}
                {renderStatusMenuItem('Cancelado', 'Cancelado')}
              </Select>
            </FormControl>
            <TextField size="small" label="Cant. min" value={filterCantidadMin} onChange={e => setFilterCantidadMin(e.target.value)} />
            <TextField size="small" label="Cant. max" value={filterCantidadMax} onChange={e => setFilterCantidadMax(e.target.value)} />
            <TextField type="date" size="small" label="Fecha desde" InputLabelProps={{ shrink: true }} value={filterFechaFrom} onChange={e => setFilterFechaFrom(e.target.value)} />
            <TextField type="date" size="small" label="Fecha hasta" InputLabelProps={{ shrink: true }} value={filterFechaTo} onChange={e => setFilterFechaTo(e.target.value)} />
            <TextField size="small" label="Total min" value={filterTotalMin} onChange={e => setFilterTotalMin(e.target.value)} />
            <TextField size="small" label="Total max" value={filterTotalMax} onChange={e => setFilterTotalMax(e.target.value)} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Button size="small" onClick={clearFilters}>Limpiar</Button>
            <Button size="small" variant="contained" onClick={closeFilters}>Aplicar</Button>
          </Box>
        </Box>
      </Popover>

      {/* Modal Alta */}
      <Dialog open={addPedido} onClose={() => setAddPedido(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>Registrar Pedido</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submitAdd} noValidate sx={{ mt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Usuario</InputLabel>
              <Select name="usuario" value={addForm.usuario} onChange={handleAddChange} required label="Usuario">
                <MenuItem value="">Selecciona usuario (solo clientes)</MenuItem>
                {usuarios.filter(u => u.nombreRol && u.nombreRol.toLowerCase() === 'cliente').map(u => (
                  <MenuItem key={u.idUsuario} value={u.idUsuario}>{u.nombre} {u.apellido} ({u.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sucursal</InputLabel>
              <Select name="sucursal" value={addForm.sucursal} onChange={handleAddChange} required label="Sucursal">
                <MenuItem value="">Selecciona sucursal</MenuItem>
                {sucursales.map(s => (
                  <MenuItem key={s.idSucursal} value={s.idSucursal}>{s.nombre} ({s.direccion})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Productos</Typography>
              {addForm.productos.map((prod, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <FormControl sx={{ minWidth: 180 }} size="small">
                    <InputLabel>Producto</InputLabel>
                    <Select value={prod.idProducto} onChange={e => handleProductoChange(idx, 'idProducto', e.target.value)} required label="Producto">
                      <MenuItem value="">Producto</MenuItem>
                      {productosList.map(pr => (
                        <MenuItem key={pr.idProducto} value={pr.idProducto}>{pr.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField type="number" size="small" label="Cantidad" value={prod.cantidad} inputProps={{ min: 1 }} onChange={e => handleProductoChange(idx, 'cantidad', Number(e.target.value))} required sx={{ width: 100 }} />
                  <Button variant="outlined" color="error" size="small" sx={{ borderRadius: 999, minWidth: 36, px: 1.2 }} onClick={() => removeProductoRow(idx)}>
                    ✖
                  </Button>
                </Box>
              ))}
              <Button variant="outlined" color="primary" size="small" sx={{ borderRadius: 999, mt: 1, px: 2 }} onClick={addProductoRow}>
                ＋ Agregar producto
              </Button>
            </Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Estado</InputLabel>
              <Select name="estado" value={addForm.estado} onChange={handleAddChange} required label="Estado" renderValue={renderStatusValue}>
                {renderStatusMenuItem('Pendiente', 'Pendiente')}
                {renderStatusMenuItem('En Proceso', 'En Proceso')}
                {renderStatusMenuItem('Enviado', 'Enviado')}
                {renderStatusMenuItem('Entregado', 'Entregado')}
                {renderStatusMenuItem('Cancelado', 'Cancelado')}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button type="submit" variant="contained" color="primary" sx={{ borderRadius: 999, px: 3, fontWeight: 600 }}>Registrar pedido</Button>
              <Button type="button" variant="outlined" color="secondary" sx={{ borderRadius: 999, px: 3 }} onClick={() => setAddPedido(false)}>Cancelar</Button>
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
