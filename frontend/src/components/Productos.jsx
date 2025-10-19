import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import '../stylos/admin/Admin.css';
import '../stylos/admin/Productos.css';

function Productos() {
  const [productos, setProductos] = useState([]);
  const [stockSucursal, setStockSucursal] = useState([]);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);
  const [editProd, setEditProd] = useState(null);
  const [deleteProd, setDeleteProd] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', stockTotal: '' });
  const [success, setSuccess] = useState(null);
  const [addProd, setAddProd] = useState(false);
  const [addForm, setAddForm] = useState({ nombre: '', descripcion: '', precio: '', stockTotal: '' });
  const [editSucursal, setEditSucursal] = useState(null); // { idSucursal, idProducto, nombreProducto, stockDisponible }
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursales, setSelectedSucursales] = useState([]);
  const [selectAllSucursales, setSelectAllSucursales] = useState(false);
  const [showBackfillModal, setShowBackfillModal] = useState(false);
  // reconcile modal removed: reconciliación ahora desde Herramientas -> Reconciliar producto
  const [showSelectReconcileModal, setShowSelectReconcileModal] = useState(false);
  const [selectedProductForReconcile, setSelectedProductForReconcile] = useState(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef(null);

  // Cerrar menú de herramientas al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleDocClick = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setToolsOpen(false);
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  useEffect(() => {
    api.get('/productos')
      .then(res => setProductos(res.data))
      .catch(() => setError('Error al obtener productos'));
    // Obtener stock por sucursal
    api.get('/stock_sucursal')
      .then(res => setStockSucursal(res.data))
      .catch(() => {});
    // Obtener lista de sucursales
    api.get('/sucursales')
      .then(res => setSucursales(res.data))
      .catch(() => {});
  }, [success]);

  const handleEdit = (prod) => {
    setEditProd(prod);
    setForm({ nombre: prod.nombre, descripcion: prod.descripcion, precio: prod.precio, stockTotal: prod.stock });
  };

  const handleDelete = (prod) => {
    setDeleteProd(prod);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Validación en tiempo real para edición
    const { name, value } = e.target;
    let errors = { ...editFieldErrors };
    if (value.trim() === '') {
      errors[name] = 'Este campo es obligatorio';
    } else {
      delete errors[name];
    }
    if (name === 'precio') {
      if (!value || isNaN(value) || Number(value) <= 0) {
        errors.precio = 'El precio debe ser mayor a 0';
      } else {
        delete errors.precio;
      }
    }
    if (name === 'stockTotal') {
      if (!value || isNaN(value) || Number(value) < 0) {
        errors.stockTotal = 'El stock debe ser 0 o mayor';
      } else {
        delete errors.stockTotal;
      }
    }
    setEditFieldErrors(errors);
  };

  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const submitEdit = (e) => {
    e.preventDefault();
    // Validación final antes de enviar
    const errors = {};
    const nombre = form.nombre.trim();
    const descripcion = form.descripcion.trim();
    if (!nombre) errors.nombre = 'El nombre es obligatorio';
    if (!descripcion) errors.descripcion = 'La descripción es obligatoria';
    if (!form.precio || isNaN(form.precio) || Number(form.precio) <= 0) errors.precio = 'El precio debe ser mayor a 0';
    if (!form.stockTotal || isNaN(form.stockTotal) || Number(form.stockTotal) < 0) errors.stockTotal = 'El stock debe ser 0 o mayor';
    setEditFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    api.put(`/productos/${editProd.idProducto}`, { ...form, nombre, descripcion, stockTotal: form.stockTotal })
      .then(() => {
        setSuccess('Producto actualizado correctamente');
        setEditProd(null);
        setEditFieldErrors({});
        setError(null);
      })
      .catch((err) => {
        let msg = 'Error al actualizar producto';
        if (err.response && err.response.data && err.response.data.message) {
          msg = err.response.data.message;
        }
        setError(msg);
      });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/productos/${deleteProd.idProducto}`);
      setSuccess('Producto eliminado correctamente');
      setDeleteProd(null);
      setDeleteError(null);
      setError(null);
    } catch (err) {
      let msg = 'Error al eliminar producto';
      if (err && err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setDeleteError(msg);
    }
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
    // Validación y limpieza
    const errors = {};
    const nombre = addForm.nombre.trim();
    const descripcion = addForm.descripcion.trim();
    if (!nombre) errors.nombre = 'El nombre es obligatorio';
    if (!descripcion) errors.descripcion = 'La descripción es obligatoria';
    if (!addForm.precio || isNaN(addForm.precio) || Number(addForm.precio) <= 0) errors.precio = 'El precio debe ser mayor a 0';
    if (!addForm.stockTotal || isNaN(addForm.stockTotal) || Number(addForm.stockTotal) < 0) errors.stockTotal = 'El stock debe ser 0 o mayor';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const payload = {
      ...addForm,
      nombre,
      descripcion,
      precio: Number(addForm.precio),
      stockTotal: Number(addForm.stockTotal),
      sucursales: selectedSucursales
    };
    try {
      await api.post('/productos', payload);
      setSuccess('Producto creado correctamente');
      setAddProd(false);
      setAddForm({ nombre: '', descripcion: '', precio: '', stockTotal: '' });
      setFieldErrors({});
      setSelectedSucursales([]);
      setError(null);
    } catch (err) {
      let msg = 'Error al crear producto';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    }
  };

  const toggleSucursal = (id) => {
    const n = Number(id);
    if (selectedSucursales.includes(n)) setSelectedSucursales(selectedSucursales.filter(x => x !== n));
    else setSelectedSucursales([...selectedSucursales, n]);
  };

  const runBackfill = async () => {
    try {
      await api.post('/stock_sucursal/backfill');
      setSuccess('Backfill ejecutado: filas faltantes creadas');
    } catch {
      setError('Error al ejecutar backfill');
    }
  };

  // preparar lista de sucursales única para columnas
  const sucursalesList = stockSucursal.reduce((acc, cur) => {
    if (!acc.find(s => s.idSucursal === cur.idSucursal)) acc.push({ idSucursal: cur.idSucursal, nombreSucursal: cur.nombreSucursal });
    return acc;
  }, []);

  return (
    <div className="productos-page">
      <div className="productos-header-container">
        <h2 className="productos-title">Productos</h2>
  <div ref={toolsRef} className="productos-tools-container">
          <button className="btn btn-success" onClick={() => setAddProd(true)}>
            <i className="bi bi-plus-circle me-1"></i> Agregar producto
          </button>
          <button className="btn btn-secondary ms-2" onClick={() => setToolsOpen(!toolsOpen)} title="Herramientas">Herramientas <i className="bi bi-caret-down-fill ms-1"></i></button>
          {toolsOpen && (
            <div className="productos-tools-dropdown card shadow-sm">
              <div className="list-group list-group-flush">
                <button className="list-group-item list-group-item-action" title="Crea o actualiza filas/columnas faltantes en el inventario" aria-label="Actualizar filas y columnas faltantes" onClick={() => { setToolsOpen(false); setShowBackfillModal(true); }}>
                  <i className="bi bi-kanban me-2"></i> Actualizar filas y columnas faltantes
                  <span className="small text-muted d-block">Crea filas faltantes por sucursal (stock=0) y actualiza la estructura.</span>
                </button>
                <button className="list-group-item list-group-item-action" title="Ajusta los stocks de cada sucursal para que la suma coincida con el stock total del producto" aria-label="Alinear stock por producto" onClick={() => { setToolsOpen(false); setShowSelectReconcileModal(true); setSelectedProductForReconcile(productos.length ? productos[0].idProducto : null); }}>
                  <i className="bi bi-sliders me-2"></i> Alinear stock por producto
                  <span className="small text-muted d-block">Ajusta cantidades en sucursales para que sumen al stock total del producto.</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Stock por sucursal */}
  {/* productos table arriba (se renderiza más abajo) */}
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="productos-table-wrapper mt-3">
        <div className="productos-card">
          <div className="table-responsive">
            <table className="table table-striped table-bordered productos-table">
           <thead className="table-dark">
              <tr>
               <th className="productos-table-header">ID</th>
               <th className="productos-table-header">Nombre</th>
               <th className="productos-table-header">Descripción</th>
               <th className="productos-table-header">Precio</th>
               <th className="productos-table-header">Stock</th>
               <th className="productos-table-header">Acciones</th>
               {sucursalesList.map(s => (
                 <th key={s.idSucursal} className="productos-table-header text-center">{s.nombreSucursal}</th>
               ))}
             </tr>
           </thead>
           <tbody>
             {productos.map(p => (
               <tr key={p.idProducto}>
                 <td className="align-middle">{p.idProducto}</td>
                 <td className="align-middle">{p.nombre}</td>
                 <td className="productos-descripcion-cell">
                   <div className="productos-descripcion-text" title={p.descripcion}>{p.descripcion}</div>
                 </td>
                 <td className="align-middle">${p.precio}</td>
                 <td className="align-middle">{p.stock}</td>
                 <td className="align-middle">
                  <div className="productos-actions-container">
                    <button className="btn btn-sm btn-primary" onClick={() => handleEdit(p)}>
                      <i className="bi bi-pencil me-1"></i> Editar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}>
                      <i className="bi bi-trash me-1"></i> Eliminar
                    </button>
                    {/* Reconciliación ahora disponible desde Herramientas -> Reconciliar producto */}
                  </div>
                 </td>
                 {sucursalesList.map(s => {
                   const stockRow = stockSucursal.find(ss => ss.idProducto === p.idProducto && ss.idSucursal === s.idSucursal);
                   return <td key={`${p.idProducto}-${s.idSucursal}`} className="text-center align-middle">{stockRow ? stockRow.stockDisponible : 0}</td>;
                 })}
               </tr>
             ))}
           </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock por sucursal: grid de dos columnas en pantallas grandes */}
      <div className="productos-stock-grid">
        {stockSucursal && stockSucursal.length === 0 && <div className="text-muted">No hay datos de stock por sucursal</div>}
        {stockSucursal && stockSucursal.length > 0 && (
          Object.entries(stockSucursal.reduce((acc, cur) => {
            const key = `${cur.idSucursal}::${cur.nombreSucursal}`;
            acc[key] = acc[key] || [];
            acc[key].push(cur);
            return acc;
          }, {})).map(([key, items]) => {
            const [, nombreSucursal] = key.split('::');
            return (
              <div key={key} className="mb-4">
                  <h5 className="productos-sucursal-title">{nombreSucursal}</h5>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-dark text-center">
                        <tr>
                          <th>Producto</th>
                          <th>Stock Disponible</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(it => (
                          <tr key={`${it.idSucursal}-${it.idProducto}`}>
                            <td>{it.nombreProducto}</td>
                            <td className="text-center align-middle">{it.stockDisponible}</td>
                            <td className="text-center align-middle">
                              <button className="btn btn-sm btn-primary" onClick={() => setEditSucursal({ idSucursal: it.idSucursal, idProducto: it.idProducto, nombreProducto: it.nombreProducto, stockDisponible: it.stockDisponible })}>
                                <i className="bi bi-pencil me-1"></i> Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            );
          })
        )}
      </div>
      {addProd && (
        <div className="productos-modal-backdrop">
          <div className="productos-modal-dialog-lg">
            <div className="productos-modal-content">
              <form onSubmit={submitAdd} noValidate className="productos-form">
                <div className="modal-header">
                  <h5 className="modal-title">Agregar Producto</h5>
                  <button type="button" className="btn-close" onClick={() => setAddProd(false)}></button>
                </div>
                <div className="productos-modal-body">
                  {error && (
                    <div className="productos-alert-danger">{error}</div>
                  )}
                  <div className="mb-2">
                    <label>Nombre</label>
                    <input type="text" className={`form-control${fieldErrors.nombre ? ' is-invalid' : ''}`} name="nombre" value={addForm.nombre} onChange={handleAddChange} required />
                    <div className="productos-field-error">
                      {fieldErrors.nombre && <span className="invalid-feedback d-block">{fieldErrors.nombre}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Descripción</label>
                    <input type="text" className={`form-control${fieldErrors.descripcion ? ' is-invalid' : ''}`} name="descripcion" value={addForm.descripcion} onChange={handleAddChange} required />
                    <div className="productos-field-error">
                      {fieldErrors.descripcion && <span className="invalid-feedback d-block">{fieldErrors.descripcion}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Precio</label>
                    <input type="number" className={`form-control${fieldErrors.precio ? ' is-invalid' : ''}`} name="precio" value={addForm.precio} onChange={handleAddChange} required min="0" step="0.01" />
                    <div className="productos-field-error">
                      {fieldErrors.precio && <span className="invalid-feedback d-block">{fieldErrors.precio}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Stock</label>
                    <input type="number" className={`form-control${fieldErrors.stockTotal ? ' is-invalid' : ''}`} name="stockTotal" value={addForm.stockTotal} onChange={handleAddChange} required min="0" />
                    <div className="productos-field-error">
                      {fieldErrors.stockTotal && <span className="invalid-feedback d-block">{fieldErrors.stockTotal}</span>}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label>Asignar a sucursales</label>
                    <div className="d-flex align-items-center gap-3 mt-2 mb-2">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="select-all-suc" checked={selectAllSucursales} onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectAllSucursales(checked);
                          if (checked) setSelectedSucursales(sucursales.map(s => s.idSucursal));
                          else setSelectedSucursales([]);
                        }} />
                        <label className="form-check-label" htmlFor="select-all-suc">Seleccionar todas</label>
                      </div>
                      <div className="text-muted small">(Selecciona las sucursales donde quieres que aparezca el producto al crearlo)</div>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {sucursales.map(s => (
                        <div key={s.idSucursal} className="form-check">
                          <input className="form-check-input" type="checkbox" value={s.idSucursal} id={`suc-${s.idSucursal}`} checked={selectedSucursales.includes(s.idSucursal)} onChange={() => toggleSucursal(s.idSucursal)} />
                          <label className="form-check-label" htmlFor={`suc-${s.idSucursal}`}>{s.nombre}</label>
                        </div>
                      ))}
                    </div>
                    <div className="form-text">Si no seleccionas ninguna sucursal, el producto se creará en todas las sucursales con stock 0 por defecto.</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success">Crear producto</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setAddProd(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edición */}
      {editProd && (
        <div className="productos-modal-backdrop">
          <div className="productos-modal-dialog-lg">
            <div className="productos-modal-content">
              <form onSubmit={submitEdit} noValidate className="productos-form">
                <div className="modal-header">
                  <h5 className="modal-title">Editar Producto</h5>
                  <button type="button" className="btn-close" onClick={() => setEditProd(null)}></button>
                </div>
                <div className="productos-modal-body">
                  {error && (
                    <div className="productos-alert-danger">{error}</div>
                  )}
                  <div className="mb-2">
                    <label>Nombre</label>
                    <input type="text" className={`form-control${editFieldErrors.nombre ? ' is-invalid' : ''}`} name="nombre" value={form.nombre} onChange={handleChange} required />
                    <div className="productos-field-error">
                      {editFieldErrors.nombre && <span className="invalid-feedback d-block">{editFieldErrors.nombre}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Descripción</label>
                    <input type="text" className={`form-control${editFieldErrors.descripcion ? ' is-invalid' : ''}`} name="descripcion" value={form.descripcion} onChange={handleChange} required />
                    <div className="productos-field-error">
                      {editFieldErrors.descripcion && <span className="invalid-feedback d-block">{editFieldErrors.descripcion}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Precio</label>
                    <input type="number" className={`form-control${editFieldErrors.precio ? ' is-invalid' : ''}`} name="precio" value={form.precio} onChange={handleChange} required min="0" />
                    <div className="productos-field-error">
                      {editFieldErrors.precio && <span className="invalid-feedback d-block">{editFieldErrors.precio}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Stock</label>
                    <input type="number" className={`form-control${editFieldErrors.stockTotal ? ' is-invalid' : ''}`} name="stockTotal" value={form.stockTotal} onChange={handleChange} required min="0" />
                    <div className="productos-field-error">
                      {editFieldErrors.stockTotal && <span className="invalid-feedback d-block">{editFieldErrors.stockTotal}</span>}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success">Guardar cambios</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditProd(null)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar stock por sucursal */}
      {editSucursal && (
        <div className="productos-modal-backdrop">
          <div className="productos-modal-dialog">
            <div className="productos-modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar stock - {editSucursal.nombreProducto} (Sucursal {editSucursal.idSucursal})</h5>
                <button type="button" className="btn-close" onClick={() => setEditSucursal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label>Stock Disponible</label>
                  <input type="number" className={`form-control`} name="stockDisponible" value={editSucursal.stockDisponible} onChange={(e) => setEditSucursal({ ...editSucursal, stockDisponible: e.target.value })} min="0" />
                </div>
                <div className="text-muted small">Solo se modifica el stock de este producto en la sucursal seleccionada; el stock total del producto se ajustará automáticamente.</div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={async () => {
                  try {
                    const payload = { stockDisponible: Number(editSucursal.stockDisponible) };
                    await api.put(`/stock_sucursal/${editSucursal.idSucursal}/${editSucursal.idProducto}`, payload);
                    setSuccess('Stock actualizado correctamente');
                    setEditSucursal(null);
                    setError(null);
                  } catch (err) {
                    let msg = 'Error al actualizar stock';
                    if (err && err.response && err.response.data && err.response.data.error) msg = err.response.data.error;
                    setError(msg);
                  }
                }}>Guardar</button>
                <button className="btn btn-secondary" onClick={() => setEditSucursal(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Borrado */}
      {deleteProd && (
        <div className="productos-modal-backdrop">
          <div className="productos-modal-dialog">
            <div className="productos-modal-content">
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar producto?</h5>
                <button type="button" className="btn-close" onClick={() => { setDeleteProd(null); setDeleteError(null); }}></button>
              </div>
              <div className="modal-body">
                {deleteError && <div className="productos-alert-danger">{deleteError}</div>}
                <p>¿Estás seguro que quieres eliminar <b>{deleteProd.nombre}</b>? Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={confirmDelete}>Eliminar</button>
                <button className="btn btn-secondary" onClick={() => { setDeleteProd(null); setDeleteError(null); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    {/* Confirmación: actualizar filas/columnas faltantes */}
    {showBackfillModal && (
      <div className="productos-modal-backdrop">
        <div className="productos-modal-dialog">
          <div className="productos-modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Actualizar filas y columnas faltantes</h5>
              <button className="btn-close" onClick={() => setShowBackfillModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Esta acción creará o actualizará las filas y columnas faltantes en el inventario por sucursal para todos los productos. Las filas creadas tendrán stock=0 por defecto. ¿Deseas continuar?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={async () => { await runBackfill(); setShowBackfillModal(false); }}>Actualizar</button>
              <button className="btn btn-secondary" onClick={() => setShowBackfillModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Reconcile confirmation modal removed; use Herramientas -> Reconciliar producto */}
    {/* Seleccionar producto para alinear stock por sucursal (desde Herramientas) */}
    {showSelectReconcileModal && (
      <div className="productos-modal-backdrop">
        <div className="productos-modal-dialog">
          <div className="productos-modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Alinear stock por sucursal (producto)</h5>
              <button className="btn-close" onClick={() => { setShowSelectReconcileModal(false); setSelectedProductForReconcile(null); }}></button>
            </div>
            <div className="modal-body">
              <p>Selecciona el producto que deseas alinear. Esta acción ajustará los stocks de cada sucursal para que su suma coincida con el stock total del producto.</p>
              <div className="mb-2">
                <label>Producto</label>
                <select className="form-select" value={selectedProductForReconcile ?? ''} onChange={(e) => setSelectedProductForReconcile(Number(e.target.value))}>
                  <option value="" disabled>-- Selecciona --</option>
                  {productos.map(p => (
                    <option key={p.idProducto} value={p.idProducto}>{p.nombre} (ID: {p.idProducto})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={async () => {
                if (!selectedProductForReconcile) return setError('Selecciona un producto para alinear');
                try {
                  await api.post(`/productos/${selectedProductForReconcile}/reconcile`);
                  setSuccess('Alineación ejecutada');
                } catch {
                  setError('Error al alinear stock');
                }
                setShowSelectReconcileModal(false);
                setSelectedProductForReconcile(null);
              }}>Alinear</button>
              <button className="btn btn-secondary" onClick={() => { setShowSelectReconcileModal(false); setSelectedProductForReconcile(null); }}>Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

export default Productos;