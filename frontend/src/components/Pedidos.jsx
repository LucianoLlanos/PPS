import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filters, setFilters] = useState({ estado: '', fechaDesde: '', fechaHasta: '', priorizarPendientes: false, sort: '' });
  const [headerFilterVisible, setHeaderFilterVisible] = useState(null); // e.g. 'estado' or 'fecha'
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deletePedido, setDeletePedido] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [addPedido, setAddPedido] = useState(false);
  const [addForm, setAddForm] = useState({ usuario: '', productos: [], estado: 'Pendiente', sucursal: '', fecha: '', total: '' });
  const [sucursales, setSucursales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [productosList, setProductosList] = useState([]);

  const loadPedidos = useCallback((appliedFilters = null, sortOverride = null) => {
    const useFilters = appliedFilters || filters || {};
    const params = {};
    if (useFilters.idPedido) params.idPedido = useFilters.idPedido;
    if (useFilters.estado) params.estado = useFilters.estado;
  if (useFilters.fecha) params.fecha = useFilters.fecha;
  if (useFilters.fechaDesde) params.fechaDesde = useFilters.fechaDesde;
  if (useFilters.fechaHasta) params.fechaHasta = useFilters.fechaHasta;
    if (useFilters.producto) params.producto = useFilters.producto;
    if (useFilters.usuario) params.usuario = useFilters.usuario;
    if (useFilters.totalMin) params.totalMin = useFilters.totalMin;
    if (useFilters.totalMax) params.totalMax = useFilters.totalMax;
    if (useFilters.cantidadMin) params.cantidadMin = useFilters.cantidadMin;
    if (useFilters.cantidadMax) params.cantidadMax = useFilters.cantidadMax;
    if (useFilters.priorizarPendientes) params.priorizarPendientes = '1';
  const sortToUse = sortOverride || (filters && filters.sort) || null;
  if (sortToUse === 'fecha_asc') params.sort = 'fecha_asc';
  if (sortToUse === 'fecha_desc') params.sort = 'fecha_desc';
  if (sortToUse === 'cantidad_asc') params.sort = 'cantidad_asc';
  if (sortToUse === 'cantidad_desc') params.sort = 'cantidad_desc';

    api.get('/ventas', { params })
      .then(res => setPedidos(res.data))
      .catch(() => setError('Error al obtener pedidos'));
  }, [filters]);

  useEffect(() => {
    loadPedidos();
    api.get('/usuarios')
      .then(res => setUsuarios(res.data))
      .catch(() => {});
    api.get('/productos')
      .then(res => setProductosList(res.data))
      .catch(() => {});
    api.get('/sucursales')
      .then(res => setSucursales(res.data))
      .catch(() => {});
    const onUsuarioCreado = () => {
      api.get('/usuarios').then(res => setUsuarios(res.data)).catch(() => {});
    };
    window.addEventListener('usuarioCreado', onUsuarioCreado);
    // Cerrar paneles de filtro al clickear fuera
    const handleDocClick = (e) => {
      // si hay un panel abierto y el click no está dentro de ninguno de los .card de filtro ni en el botón que lo abre, cerrarlos
      if (headerFilterVisible) {
        const clickedCard = e.target.closest && e.target.closest('.card');
        const clickedTrigger = e.target.closest && e.target.closest('.filter-trigger');
        if (!clickedCard && !clickedTrigger) setHeaderFilterVisible(null);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => { window.removeEventListener('usuarioCreado', onUsuarioCreado); document.removeEventListener('click', handleDocClick); };
  }, [success, loadPedidos, headerFilterVisible]);

  // Los filtros ahora se manejan desde los controles en la cabecera y el badge Limpiar
  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleProductoChange = (idx, field, value) => {
    const nuevos = [...addForm.productos];
    nuevos[idx][field] = value;
    setAddForm({ ...addForm, productos: nuevos });
  };

  const addProductoRow = () => {
    setAddForm({ ...addForm, productos: [...addForm.productos, { idProducto: '', cantidad: 1 }] });
  };

  const removeProductoRow = (idx) => {
    const nuevos = [...addForm.productos];
    nuevos.splice(idx, 1);
    setAddForm({ ...addForm, productos: nuevos });
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const submitAdd = async (e) => {
    e.preventDefault();
    // Validación
    const errors = {};
  if (!addForm.usuario) errors.usuario = 'Debes seleccionar un usuario';
  if (!addForm.sucursal) errors.sucursal = 'Debes seleccionar una sucursal';
  if (!addForm.productos.length) errors.productos = 'Debes agregar al menos un producto';
    addForm.productos.forEach((prod, idx) => {
      if (!prod.idProducto) errors[`producto_${idx}`] = 'Selecciona un producto';
      if (!prod.cantidad || isNaN(prod.cantidad) || Number(prod.cantidad) <= 0) errors[`cantidad_${idx}`] = 'Cantidad debe ser mayor a 0';
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    // Calcular productos con precioUnitario y asegurar tipos numéricos
    const productosPayload = addForm.productos.map(p => {
      const prod = productosList.find(pr => Number(pr.idProducto) === Number(p.idProducto));
      return {
        idProducto: Number(p.idProducto),
        cantidad: Number(p.cantidad),
        precioUnitario: prod ? Number(prod.precio) : 0
      };
    });
    // idSucursalOrigen temporal (usar 1 por defecto)
    // Mapeo seguro de estado
    const estadosValidos = ['Pendiente', 'En Proceso', 'Enviado', 'Entregado', 'Cancelado'];
    const estadoFinal = estadosValidos.includes(addForm.estado) ? addForm.estado : 'Pendiente';
    const payload = {
  idCliente: Number(addForm.usuario),
  idSucursalOrigen: Number(addForm.sucursal),
      estado: estadoFinal,
      productos: productosPayload
    };
    try {
      await api.post('/ventas', payload);
      setSuccess('Pedido creado correctamente');
      setAddPedido(false);
  setAddForm({ usuario: '', productos: [], estado: 'Pendiente', fecha: '', total: '' });
      setFieldErrors({});
      setError(null);
    } catch (err) {
      let msg = 'Error al crear pedido';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    }
  };

  const handleDelete = (pedido) => {
    setDeletePedido(pedido);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/ventas/${deletePedido.idPedido}`);
      setSuccess('Pedido eliminado correctamente');
      setDeletePedido(null);
      setDeleteError(null);
      setError(null);
    } catch (err) {
      let msg = 'Error al eliminar pedido';
      if (err && err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setDeleteError(msg);
    }
  };

  // Cambiar estado del pedido
  const handleEstado = (pedido, nuevoEstado) => {
    api.put(`/ventas/${pedido.idPedido}`, { estado: nuevoEstado })
      .then(() => setSuccess('Estado actualizado'))
      .catch(() => setError('Error al actualizar estado'));
  };

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Pedidos</h2>
        <button className="btn btn-success" onClick={() => setAddPedido(true)}>
          <i className="bi bi-plus-circle"></i> Registrar pedido
        </button>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="table-responsive">
        {/* Indicador compacto de filtros activos */}
        <div className="mb-2 d-flex gap-2 align-items-center">
          {filters.estado && <span className="badge bg-info text-dark">Estado: {filters.estado}</span>}
          {(filters.fecha || filters.fechaDesde || filters.fechaHasta) && <span className="badge bg-info text-dark">Fecha: {filters.fecha ? filters.fecha : `${filters.fechaDesde || '...'} - ${filters.fechaHasta || '...'}`}</span>}
          {filters.sort && (
            <span className="badge bg-secondary">
              Orden: {filters.sort.startsWith('fecha') ? `Fecha ${filters.sort === 'fecha_asc' ? '↑' : '↓'}` : filters.sort.startsWith('cantidad') ? `Cantidad ${filters.sort === 'cantidad_asc' ? '↑' : '↓'}` : filters.sort}
            </span>
          )}
          {(filters.estado || filters.fecha || filters.fechaDesde || filters.fechaHasta || filters.sort || filters.idPedido || filters.producto || filters.usuario || filters.totalMin || filters.totalMax || filters.cantidadMin || filters.cantidadMax) && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => { setFilters({ idPedido: '', producto: '', usuario: '', estado: '', fecha: '', fechaDesde: '', fechaHasta: '', totalMin: '', totalMax: '', cantidadMin: '', cantidadMax: '', priorizarPendientes: false, sort: '' }); loadPedidos({}); }}>Limpiar filtros</button>
          )}
        </div>
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>
                ID
                <button type="button" className="btn btn-sm btn-link text-primary ms-2 p-0 filter-trigger" onClick={() => { const nextVisible = headerFilterVisible === 'id' ? null : 'id'; setHeaderFilterVisible(nextVisible); }} aria-label="Filtro ID">
                  <i className="bi bi-caret-down-fill text-primary"></i>
                </button>
                {headerFilterVisible === 'id' && (
                  <div className="card p-2" style={{position: 'absolute', zIndex: 50, background: 'white', color: '#000'}}>
                    <div className="mb-1"><input className="form-control form-control-sm" placeholder="ID exacto" type="number" onKeyDown={(e) => { if (e.key === 'Enter') { const val = e.target.value; const nf = { ...filters, idPedido: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); } }} /></div>
                    <div className="d-flex gap-1"><button className="btn btn-sm btn-primary" onClick={(ev) => { const input = ev.target.closest('.card').querySelector('input'); const val = input.value; const nf = { ...filters, idPedido: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Aplicar</button><button className="btn btn-sm btn-secondary" onClick={() => { const nf = { ...filters, idPedido: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Limpiar</button></div>
                  </div>
                )}
              </th>
              <th>
                Producto
                <button type="button" className="btn btn-sm btn-link text-primary ms-2 p-0 filter-trigger" onClick={() => { const nextVisible = headerFilterVisible === 'producto' ? null : 'producto'; setHeaderFilterVisible(nextVisible); }} aria-label="Filtro producto">
                  <i className="bi bi-caret-down-fill text-primary"></i>
                </button>
                {headerFilterVisible === 'producto' && (
                  <div className="card p-2" style={{position: 'absolute', zIndex: 50, background: 'white', color: '#000'}}>
                    <div className="mb-1"><input className="form-control form-control-sm" placeholder="Nombre producto" type="text" defaultValue={filters.producto || ''} onKeyDown={(e) => { if (e.key === 'Enter') { const val = e.target.value; const nf = { ...filters, producto: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); } }} /></div>
                    <div className="d-flex gap-1"><button className="btn btn-sm btn-primary" onClick={(ev) => { const input = ev.target.closest('.card').querySelector('input'); const val = input.value; const nf = { ...filters, producto: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Aplicar</button><button className="btn btn-sm btn-secondary" onClick={() => { const nf = { ...filters, producto: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Limpiar</button></div>
                  </div>
                )}
              </th>
              <th>
                Usuario
                <button type="button" className="btn btn-sm btn-link text-primary ms-2 p-0 filter-trigger" onClick={() => { const nextVisible = headerFilterVisible === 'usuario' ? null : 'usuario'; setHeaderFilterVisible(nextVisible); }} aria-label="Filtro usuario">
                  <i className="bi bi-caret-down-fill text-primary"></i>
                </button>
                {headerFilterVisible === 'usuario' && (
                  <div className="card p-2" style={{position: 'absolute', zIndex: 50, background: 'white', color: '#000'}}>
                    <div className="mb-1"><input className="form-control form-control-sm" placeholder="Nombre, apellido o email" type="text" defaultValue={filters.usuario || ''} onKeyDown={(e) => { if (e.key === 'Enter') { const val = e.target.value; const nf = { ...filters, usuario: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); } }} /></div>
                    <div className="d-flex gap-1"><button className="btn btn-sm btn-primary" onClick={(ev) => { const input = ev.target.closest('.card').querySelector('input'); const val = input.value; const nf = { ...filters, usuario: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Aplicar</button><button className="btn btn-sm btn-secondary" onClick={() => { const nf = { ...filters, usuario: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Limpiar</button></div>
                  </div>
                )}
              </th>
              <th>
                Cantidad
                <button type="button" className="btn btn-sm btn-link text-white ms-2 p-0" onClick={() => {
                  const nextOrder = filters.sort === 'cantidad_asc' ? 'cantidad_desc' : 'cantidad_asc';
                  const newFilters = { ...filters, sort: nextOrder };
                  setFilters(newFilters);
                  loadPedidos(newFilters, nextOrder);
                }} aria-label="Ordenar por cantidad">
                  <i className={`bi ${filters.sort === 'cantidad_asc' ? 'bi-chevron-up' : filters.sort === 'cantidad_desc' ? 'bi-chevron-down' : 'bi-chevron-expand'} fs-5 text-white`}></i>
                </button>
                <button type="button" className="btn btn-sm btn-link text-primary ms-1 p-0 filter-trigger" onClick={() => { const nextVisible = headerFilterVisible === 'cantidad' ? null : 'cantidad'; setHeaderFilterVisible(nextVisible); }} aria-label="Filtro cantidad">
                  <i className="bi bi-caret-down-fill text-primary"></i>
                </button>
                {headerFilterVisible === 'cantidad' && (
                  <div className="card p-2" style={{position: 'absolute', zIndex: 50, background: 'white', color: '#000', minWidth: 200}}>
                    <div className="mb-1 d-flex gap-1"><input type="number" className="form-control form-control-sm" placeholder="Min" defaultValue={filters.cantidadMin || ''} /><input type="number" className="form-control form-control-sm" placeholder="Max" defaultValue={filters.cantidadMax || ''} /></div>
                    <div className="d-flex gap-1"><button className="btn btn-sm btn-primary" onClick={(ev) => { const card = ev.target.closest('.card'); const inputs = card.querySelectorAll('input'); const min = inputs[0].value; const max = inputs[1].value; const nf = { ...filters, cantidadMin: min || '', cantidadMax: max || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Aplicar</button><button className="btn btn-sm btn-secondary" onClick={() => { const nf = { ...filters, cantidadMin: '', cantidadMax: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Limpiar</button></div>
                  </div>
                )}
              </th>
              <th>
                Fecha
                <button type="button" className="btn btn-sm btn-link text-white ms-2 p-0" onClick={() => {
                  // toggle sort for fecha in unified filters
                  const nextOrder = filters.sort === 'fecha_asc' ? 'fecha_desc' : 'fecha_asc';
                  const newFilters = { ...filters, sort: nextOrder };
                  setFilters(newFilters);
                  loadPedidos(newFilters, nextOrder);
                }} aria-label="Ordenar por fecha">
                  <i className={`bi ${filters.sort === 'fecha_asc' ? 'bi-chevron-up' : filters.sort === 'fecha_desc' ? 'bi-chevron-down' : 'bi-chevron-expand'} fs-5 text-white`}></i>
                </button>
                <button type="button" className="btn btn-sm btn-link text-primary ms-1 p-0 filter-trigger" onClick={() => { const nextVisible = headerFilterVisible === 'fecha' ? null : 'fecha'; setHeaderFilterVisible(nextVisible); }} aria-label="Filtro fecha">
                  <i className="bi bi-caret-down-fill text-primary"></i>
                </button>
                {headerFilterVisible === 'fecha' && (
                  <div className="card p-2" style={{position: 'absolute', zIndex: 50, background: 'white', color: '#000', minWidth: 260}}>
                    <div className="mb-2">
                      <label className="form-label" style={{fontSize: '0.85em'}}>Fecha exacta</label>
                      <input name="fechaExacta" type="date" className="form-control form-control-sm" defaultValue={filters.fecha || ''} />
                    </div>
                    <div className="mb-2">
                      <label className="form-label" style={{fontSize: '0.85em'}}>O rango</label>
                      <div className="d-flex gap-1"><input name="fechaDesde" type="date" className="form-control form-control-sm" defaultValue={filters.fechaDesde || ''} /><input name="fechaHasta" type="date" className="form-control form-control-sm" defaultValue={filters.fechaHasta || ''} /></div>
                    </div>
                    <div className="d-flex gap-1"><button className="btn btn-sm btn-primary" onClick={(ev) => { const card = ev.target.closest('.card'); const exact = card.querySelector('input[name="fechaExacta"]').value; const from = card.querySelector('input[name="fechaDesde"]').value; const to = card.querySelector('input[name="fechaHasta"]').value; let nf; if (exact) { nf = { ...filters, fecha: exact, fechaDesde: '', fechaHasta: '' }; } else { nf = { ...filters, fecha: '', fechaDesde: from || '', fechaHasta: to || '' }; } setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Aplicar</button><button className="btn btn-sm btn-secondary" onClick={() => { const nf = { ...filters, fecha: '', fechaDesde: '', fechaHasta: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Limpiar</button></div>
                  </div>
                )}
              </th>
              <th>
                Total
                <button type="button" className="btn btn-sm btn-link text-primary ms-2 p-0 filter-trigger" onClick={() => { const nextVisible = headerFilterVisible === 'total' ? null : 'total'; setHeaderFilterVisible(nextVisible); }} aria-label="Filtro total">
                  <i className="bi bi-caret-down-fill text-primary"></i>
                </button>
                {headerFilterVisible === 'total' && (
                  <div className="card p-2" style={{position: 'absolute', zIndex: 50, background: 'white', color: '#000', minWidth: 200}}>
                    <div className="mb-1 d-flex gap-1"><input type="number" className="form-control form-control-sm" placeholder="Min" defaultValue={filters.totalMin || ''} /><input type="number" className="form-control form-control-sm" placeholder="Max" defaultValue={filters.totalMax || ''} /></div>
                    <div className="d-flex gap-1"><button className="btn btn-sm btn-primary" onClick={(ev) => { const card = ev.target.closest('.card'); const inputs = card.querySelectorAll('input'); const min = inputs[0].value; const max = inputs[1].value; const nf = { ...filters, totalMin: min || '', totalMax: max || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Aplicar</button><button className="btn btn-sm btn-secondary" onClick={() => { const nf = { ...filters, totalMin: '', totalMax: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Limpiar</button></div>
                  </div>
                )}
              </th>
              <th>
                Estado
                <div style={{display: 'inline-block', marginLeft: 6}}>
                  <button type="button" className="btn btn-sm btn-link text-primary ms-2 p-0 filter-trigger" onClick={() => {
                    const nextVisible = headerFilterVisible === 'estado' ? null : 'estado';
                    setHeaderFilterVisible(nextVisible);
                  }} aria-label="Filtro estado"><i className="bi bi-caret-down-fill text-primary"></i></button>
                  {headerFilterVisible === 'estado' && (
                    <div className="card p-2" style={{position: 'absolute', zIndex: 50, background: 'white', color: '#000'}}>
                      <div><button className="btn btn-sm btn-light w-100 mb-1" onClick={() => { const nf = { ...filters, estado: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Todos</button></div>
                      <div><button className="btn btn-sm btn-light w-100 mb-1" onClick={() => { const nf = { ...filters, estado: 'Pendiente' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Pendiente</button></div>
                      <div><button className="btn btn-sm btn-light w-100 mb-1" onClick={() => { const nf = { ...filters, estado: 'En Proceso' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>En Proceso</button></div>
                      <div><button className="btn btn-sm btn-light w-100 mb-1" onClick={() => { const nf = { ...filters, estado: 'Enviado' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Enviado</button></div>
                      <div><button className="btn btn-sm btn-light w-100 mb-1" onClick={() => { const nf = { ...filters, estado: 'Entregado' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Entregado</button></div>
                      <div><button className="btn btn-sm btn-light w-100" onClick={() => { const nf = { ...filters, estado: 'Cancelado' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Cancelado</button></div>
                    </div>
                  )}
                </div>
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(p => (
              <tr key={p.idPedido}>
                <td>{p.idPedido}</td>
                <td>
                  {p.productos.map((prod, idx) => (
                    <div key={idx}>{prod.nombre} <span className="text-muted">(x{prod.cantidad})</span></div>
                  ))}
                </td>
                <td>{p.nombreUsuario} {p.apellidoUsuario}</td>
                <td>
                  {p.productos.map((prod, idx) => (
                    <div key={idx}>{prod.cantidad}</div>
                  ))}
                </td>
                <td>{new Date(p.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td>${p.total}</td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={p.estado || 'Pendiente'}
                    onChange={e => handleEstado(p, e.target.value)}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}>
                    <i className="bi bi-trash"></i> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Alta */}
      {addPedido && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{background: 'rgba(0,0,0,0.3)'}}>
          <div className="modal-dialog modal-lg" role="document" style={{maxWidth: '700px'}}>
            <div className="modal-content" style={{maxHeight: '90vh', minHeight: '400px', display: 'flex', flexDirection: 'column'}}>
              <form onSubmit={submitAdd} noValidate style={{height: '100%'}}>
                <div className="modal-header">
                  <h5 className="modal-title">Registrar Pedido</h5>
                  <button type="button" className="btn-close" onClick={() => setAddPedido(false)}></button>
                </div>
                <div className="modal-body" style={{overflowY: 'auto', maxHeight: '65vh'}}>
                  {error && (
                    <div className="alert alert-danger mb-3" style={{fontSize: '1em'}}>{error}</div>
                  )}
                  <div className="mb-2">
                    <label>Usuario</label>
                    <select className={`form-select${fieldErrors.usuario ? ' is-invalid' : ''}`} name="usuario" value={addForm.usuario} onChange={handleAddChange} required>
                      <option value="">Selecciona usuario (solo clientes)</option>
                      {usuarios
                        .filter(u => u.nombreRol && u.nombreRol.toLowerCase() === 'cliente')
                        .map(u => (
                          <option key={u.idUsuario} value={u.idUsuario}>{u.nombre} {u.apellido} ({u.email})</option>
                      ))}
                    </select>
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {fieldErrors.usuario && <span className="invalid-feedback d-block">{fieldErrors.usuario}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Sucursal</label>
                    <select className={`form-select${fieldErrors.sucursal ? ' is-invalid' : ''}`} name="sucursal" value={addForm.sucursal} onChange={handleAddChange} required>
                      <option value="">Selecciona sucursal</option>
                      {sucursales.map(s => (
                        <option key={s.idSucursal} value={s.idSucursal}>{s.nombre} ({s.direccion})</option>
                      ))}
                    </select>
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {fieldErrors.sucursal && <span className="invalid-feedback d-block">{fieldErrors.sucursal}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Productos</label>
                    {fieldErrors.productos && <div className="invalid-feedback d-block mb-1">{fieldErrors.productos}</div>}
                    {addForm.productos.map((prod, idx) => (
                      <div key={idx} className="d-flex align-items-center mb-1 gap-2">
                        <select className={`form-select${fieldErrors[`producto_${idx}`] ? ' is-invalid' : ''}`} style={{maxWidth: 180}} value={prod.idProducto} onChange={e => handleProductoChange(idx, 'idProducto', e.target.value)} required>
                          <option value="">Producto</option>
                          {productosList.map(pr => (
                            <option key={pr.idProducto} value={pr.idProducto}>{pr.nombre}</option>
                          ))}
                        </select>
                        <input type="number" className={`form-control${fieldErrors[`cantidad_${idx}`] ? ' is-invalid' : ''}`} style={{maxWidth: 100}} value={prod.cantidad} min="1" onChange={e => handleProductoChange(idx, 'cantidad', Number(e.target.value))} required />
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => removeProductoRow(idx)}>
                          <i className="bi bi-x"></i>
                        </button>
                        <div style={{minHeight: 18, fontSize: '0.85em'}}>
                          {fieldErrors[`producto_${idx}`] && <span className="invalid-feedback d-block">{fieldErrors[`producto_${idx}`]}</span>}
                          {fieldErrors[`cantidad_${idx}`] && <span className="invalid-feedback d-block">{fieldErrors[`cantidad_${idx}`]}</span>}
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-secondary mt-1" onClick={addProductoRow}>
                      <i className="bi bi-plus"></i> Agregar producto
                    </button>
                  </div>
                  <div className="mb-2">
                    <label>Estado</label>
                    <select className="form-select" name="estado" value={addForm.estado} onChange={handleAddChange} required>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Entregado">Entregado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success">Registrar pedido</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setAddPedido(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Modal Borrado */}
      {deletePedido && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{background: 'rgba(0,0,0,0.3)'}}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar pedido?</h5>
                <button type="button" className="btn-close" onClick={() => { setDeletePedido(null); setDeleteError(null); }}></button>
              </div>
              <div className="modal-body">
                {deleteError && <div className="alert alert-danger mb-2">{deleteError}</div>}
                <p>¿Estás seguro que quieres eliminar el pedido <b>#{deletePedido.idPedido}</b>? Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={confirmDelete}>Eliminar</button>
                <button className="btn btn-secondary" onClick={() => { setDeletePedido(null); setDeleteError(null); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pedidos;
