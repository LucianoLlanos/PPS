import { useEffect, useState } from 'react';
import api from '../api/axios';

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
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

  useEffect(() => {
    api.get('/ventas')
      .then(res => setPedidos(res.data))
      .catch(() => setError('Error al obtener pedidos'));
    api.get('/usuarios')
      .then(res => setUsuarios(res.data))
      .catch(() => {});
    api.get('/productos')
      .then(res => setProductosList(res.data))
      .catch(() => {});
    api.get('/sucursales')
      .then(res => setSucursales(res.data))
      .catch(() => {});
  }, [success]);
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
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Usuario</th>
              <th>Cantidad</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
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
                      <option value="">Selecciona usuario</option>
                      {usuarios.map(u => (
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
