import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import '../stylos/admin/Admin.css';
import '../stylos/admin/Pedidos.css';

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
          {(filters.fechaDesde || filters.fechaHasta) && <span className="badge bg-info text-dark">Fecha: {filters.fechaDesde || '...'} - {filters.fechaHasta || '...'}</span>}
          {filters.sort && (
            <span className="badge bg-secondary">
              Orden: {
                filters.sort.startsWith('fecha')
                  ? `Fecha ${filters.sort === 'fecha_asc' ? '↑' : '↓'}`
                  : filters.sort.startsWith('cantidad')
                  ? `Cantidad ${filters.sort === 'cantidad_asc' ? '↑' : '↓'}`
                  : filters.sort
              }
            </span>
          )}
          {(filters.estado || filters.fechaDesde || filters.fechaHasta || filters.sort || filters.idPedido || filters.producto || filters.usuario || filters.totalMin || filters.totalMax || filters.cantidadMin || filters.cantidadMax) && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => { setFilters({ idPedido: '', producto: '', usuario: '', estado: '', fechaDesde: '', fechaHasta: '', totalMin: '', totalMax: '', cantidadMin: '', cantidadMax: '', priorizarPendientes: false, sort: '' }); loadPedidos({}); }}>Limpiar filtros</button>
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
                  <div className="pedidos-filter-dropdown">
                    <div className="mb-1"><input className="form-control form-control-sm" placeholder="ID exacto" type="number" onKeyDown={(e) => { if (e.key === 'Enter') { const val = e.target.value; const nf = { ...filters, idPedido: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); } }} /></div>
                    <div className="d-flex gap-1"><button className="btn btn-sm btn-primary" onClick={(ev) => { const input = ev.target.closest('.pedidos-filter-dropdown').querySelector('input'); const val = input.value; const nf = { ...filters, idPedido: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Aplicar</button><button className="btn btn-sm btn-secondary" onClick={() => { const nf = { ...filters, idPedido: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Limpiar</button></div>
                  </div>
                )}
              </th>
              <th>
                Producto
                <button type="button" className="btn btn-sm btn-link text-primary ms-2 p-0 filter-trigger" onClick={() => { const nextVisible = headerFilterVisible === 'producto' ? null : 'producto'; setHeaderFilterVisible(nextVisible); }} aria-label="Filtro producto">
                  <i className="bi bi-caret-down-fill text-primary"></i>
                </button>
                {headerFilterVisible === 'producto' && (
                  <div className="pedidos-filter-dropdown">
                    <div className="mb-1"><input className="form-control form-control-sm" placeholder="Nombre producto" type="text" defaultValue={filters.producto || ''} onKeyDown={(e) => { if (e.key === 'Enter') { const val = e.target.value; const nf = { ...filters, producto: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); } }} /></div>
                    <div className="d-flex gap-1"><button className="btn btn-sm btn-primary" onClick={(ev) => { const input = ev.target.closest('.pedidos-filter-dropdown').querySelector('input'); const val = input.value; const nf = { ...filters, producto: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Aplicar</button><button className="btn btn-sm btn-secondary" onClick={() => { const nf = { ...filters, producto: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Limpiar</button></div>
                  </div>
                )}
              </th>
              <th>
                Usuario
                <button type="button" className="btn btn-sm btn-link text-primary ms-2 p-0 filter-trigger" onClick={() => { const nextVisible = headerFilterVisible === 'usuario' ? null : 'usuario'; setHeaderFilterVisible(nextVisible); }} aria-label="Filtro usuario">
                  <i className="bi bi-caret-down-fill text-primary"></i>
                </button>
                {headerFilterVisible === 'usuario' && (
                  <div className="pedidos-filter-dropdown">
                    <div className="mb-1"><input className="form-control form-control-sm" placeholder="Nombre, apellido o email" type="text" defaultValue={filters.usuario || ''} onKeyDown={(e) => { if (e.key === 'Enter') { const val = e.target.value; const nf = { ...filters, usuario: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); } }} /></div>
                    <div className="d-flex gap-1"><button className="btn btn-sm btn-primary" onClick={(ev) => { const input = ev.target.closest('.pedidos-filter-dropdown').querySelector('input'); const val = input.value; const nf = { ...filters, usuario: val || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Aplicar</button><button className="btn btn-sm btn-secondary" onClick={() => { const nf = { ...filters, usuario: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Limpiar</button></div>
                  </div>
                )}
              </th>
              <th>
                Cantidad
                <button type="button" className="btn btn-sm btn-link text-primary ms-2 p-0" onClick={() => {
                  const nextOrder = filters.sort === 'cantidad_asc' ? 'cantidad_desc' : 'cantidad_asc';
                  const newFilters = { ...filters, sort: nextOrder };
                  setFilters(newFilters);
                  loadPedidos(newFilters, nextOrder);
                }} aria-label="Ordenar por cantidad">{filters.sort === 'cantidad_asc' ? '↑' : filters.sort === 'cantidad_desc' ? '↓' : '↕'}</button>
                <button type="button" className="btn btn-sm btn-link text-primary ms-1 p-0 filter-trigger" onClick={() => { const nextVisible = headerFilterVisible === 'cantidad' ? null : 'cantidad'; setHeaderFilterVisible(nextVisible); }} aria-label="Filtro cantidad">
                  <i className="bi bi-caret-down-fill text-primary"></i>
                </button>
                {headerFilterVisible === 'cantidad' && (
                  <div className="pedidos-filter-dropdown-wide">
                    <div className="mb-1 d-flex gap-1"><input type="number" className="form-control form-control-sm" placeholder="Min" defaultValue={filters.cantidadMin || ''} /><input type="number" className="form-control form-control-sm" placeholder="Max" defaultValue={filters.cantidadMax || ''} /></div>
                    <div className="d-flex gap-1"><button className="btn btn-sm btn-primary" onClick={(ev) => { const card = ev.target.closest('.pedidos-filter-dropdown-wide'); const inputs = card.querySelectorAll('input'); const min = inputs[0].value; const max = inputs[1].value; const nf = { ...filters, cantidadMin: min || '', cantidadMax: max || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Aplicar</button><button className="btn btn-sm btn-secondary" onClick={() => { const nf = { ...filters, cantidadMin: '', cantidadMax: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Limpiar</button></div>
                  </div>
                )}
              </th>
              <th>
                Fecha
                <button type="button" className="btn btn-sm btn-link text-primary ms-2 p-0" onClick={() => {
                  // toggle sort for fecha in unified filters
                  const nextOrder = filters.sort === 'fecha_asc' ? 'fecha_desc' : 'fecha_asc';
                  const newFilters = { ...filters, sort: nextOrder };
                  setFilters(newFilters);
                  loadPedidos(newFilters, nextOrder);
                }} aria-label="Ordenar por fecha">
                  {filters.sort === 'fecha_asc' ? '↑' : filters.sort === 'fecha_desc' ? '↓' : '↕'}
                </button>
              </th>
              <th>
                Total
                <button type="button" className="btn btn-sm btn-link text-primary ms-2 p-0 filter-trigger" onClick={() => { const nextVisible = headerFilterVisible === 'total' ? null : 'total'; setHeaderFilterVisible(nextVisible); }} aria-label="Filtro total">
                  <i className="bi bi-caret-down-fill text-primary"></i>
                </button>
                {headerFilterVisible === 'total' && (
                  <div className="pedidos-filter-dropdown-wide">
                    <div className="mb-1 d-flex gap-1"><input type="number" className="form-control form-control-sm" placeholder="Min" defaultValue={filters.totalMin || ''} /><input type="number" className="form-control form-control-sm" placeholder="Max" defaultValue={filters.totalMax || ''} /></div>
                    <div className="d-flex gap-1"><button className="btn btn-sm btn-primary" onClick={(ev) => { const card = ev.target.closest('.pedidos-filter-dropdown-wide'); const inputs = card.querySelectorAll('input'); const min = inputs[0].value; const max = inputs[1].value; const nf = { ...filters, totalMin: min || '', totalMax: max || '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Aplicar</button><button className="btn btn-sm btn-secondary" onClick={() => { const nf = { ...filters, totalMin: '', totalMax: '' }; setFilters(nf); setHeaderFilterVisible(null); loadPedidos(nf); }}>Limpiar</button></div>
                  </div>
                )}
              </th>
              <th>
                Estado
                <div className="pedidos-estado-filter-container">
                  <button type="button" className="btn btn-sm btn-link text-primary ms-2 p-0 filter-trigger" onClick={() => {
                    const nextVisible = headerFilterVisible === 'estado' ? null : 'estado';
                    setHeaderFilterVisible(nextVisible);
                  }} aria-label="Filtro estado"><i className="bi bi-caret-down-fill text-primary"></i></button>
                  {headerFilterVisible === 'estado' && (
                    <div className="pedidos-filter-dropdown">
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
        <div className="pedidos-modal-backdrop">
          <div className="pedidos-modal-dialog-lg">
            <div className="pedidos-modal-content">
              <form onSubmit={submitAdd} noValidate className="pedidos-form">
                <div className="modal-header">
                  <h5 className="modal-title">Registrar Pedido</h5>
                  <button type="button" className="btn-close" onClick={() => setAddPedido(false)}></button>
                </div>
                <div className="pedidos-modal-body">
                  {error && (
                    <div className="pedidos-alert-danger">{error}</div>
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
                    <div className="pedidos-field-error">
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
                    <div className="pedidos-field-error">
                      {fieldErrors.sucursal && <span className="invalid-feedback d-block">{fieldErrors.sucursal}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Productos</label>
                    {fieldErrors.productos && <div className="invalid-feedback d-block mb-1">{fieldErrors.productos}</div>}
                    {addForm.productos.map((prod, idx) => (
                      <div key={idx} className="d-flex align-items-center mb-1 gap-2">
                        <select className={`form-select pedidos-producto-select${fieldErrors[`producto_${idx}`] ? ' is-invalid' : ''}`} value={prod.idProducto} onChange={e => handleProductoChange(idx, 'idProducto', e.target.value)} required>
                          <option value="">Producto</option>
                          {productosList.map(pr => (
                            <option key={pr.idProducto} value={pr.idProducto}>{pr.nombre}</option>
                          ))}
                        </select>
                        <input type="number" className={`form-control pedidos-cantidad-input${fieldErrors[`cantidad_${idx}`] ? ' is-invalid' : ''}`} value={prod.cantidad} min="1" onChange={e => handleProductoChange(idx, 'cantidad', Number(e.target.value))} required />
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => removeProductoRow(idx)}>
                          <i className="bi bi-x"></i>
                        </button>
                        <div className="pedidos-field-error">
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
        <div className="pedidos-modal-backdrop">
          <div className="pedidos-modal-dialog">
            <div className="pedidos-modal-content">
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar pedido?</h5>
                <button type="button" className="btn-close" onClick={() => { setDeletePedido(null); setDeleteError(null); }}></button>
              </div>
              <div className="modal-body">
                {deleteError && <div className="pedidos-alert-danger">{deleteError}</div>}
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
