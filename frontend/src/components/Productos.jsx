import { useEffect, useState } from 'react';
import api from '../api/axios';

function Productos() {
  const [productos, setProductos] = useState([]);
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

  useEffect(() => {
    api.get('/productos')
      .then(res => setProductos(res.data))
      .catch(() => setError('Error al obtener productos'));
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
      stockTotal: Number(addForm.stockTotal)
    };
    try {
      await api.post('/productos', payload);
      setSuccess('Producto creado correctamente');
      setAddProd(false);
      setAddForm({ nombre: '', descripcion: '', precio: '', stockTotal: '' });
      setFieldErrors({});
      setError(null);
    } catch (err) {
      let msg = 'Error al crear producto';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    }
  };

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Productos</h2>
        <button className="btn btn-success" onClick={() => setAddProd(true)}>
          <i className="bi bi-plus-circle"></i> Agregar producto
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.idProducto}>
                <td>{p.idProducto}</td>
                <td>{p.nombre}</td>
                <td>{p.descripcion}</td>
                <td>${p.precio}</td>
                <td>{p.stock}</td>
                <td>
                  <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(p)}>
                    <i className="bi bi-pencil"></i> Editar
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}>
                    <i className="bi bi-trash"></i> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {addProd && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{background: 'rgba(0,0,0,0.3)'}}>
          <div className="modal-dialog modal-lg" role="document" style={{maxWidth: '700px'}}>
            <div className="modal-content" style={{maxHeight: '90vh', minHeight: '400px', display: 'flex', flexDirection: 'column'}}>
              <form onSubmit={submitAdd} noValidate style={{height: '100%'}}>
                <div className="modal-header">
                  <h5 className="modal-title">Agregar Producto</h5>
                  <button type="button" className="btn-close" onClick={() => setAddProd(false)}></button>
                </div>
                <div className="modal-body" style={{overflowY: 'auto', maxHeight: '65vh'}}>
                  {error && (
                    <div className="alert alert-danger mb-3" style={{fontSize: '1em'}}>{error}</div>
                  )}
                  <div className="mb-2">
                    <label>Nombre</label>
                    <input type="text" className={`form-control${fieldErrors.nombre ? ' is-invalid' : ''}`} name="nombre" value={addForm.nombre} onChange={handleAddChange} required />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {fieldErrors.nombre && <span className="invalid-feedback d-block">{fieldErrors.nombre}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Descripción</label>
                    <input type="text" className={`form-control${fieldErrors.descripcion ? ' is-invalid' : ''}`} name="descripcion" value={addForm.descripcion} onChange={handleAddChange} required />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {fieldErrors.descripcion && <span className="invalid-feedback d-block">{fieldErrors.descripcion}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Precio</label>
                    <input type="number" className={`form-control${fieldErrors.precio ? ' is-invalid' : ''}`} name="precio" value={addForm.precio} onChange={handleAddChange} required min="0" step="0.01" />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {fieldErrors.precio && <span className="invalid-feedback d-block">{fieldErrors.precio}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Stock</label>
                    <input type="number" className={`form-control${fieldErrors.stockTotal ? ' is-invalid' : ''}`} name="stockTotal" value={addForm.stockTotal} onChange={handleAddChange} required min="0" />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {fieldErrors.stockTotal && <span className="invalid-feedback d-block">{fieldErrors.stockTotal}</span>}
                    </div>
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
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{background: 'rgba(0,0,0,0.3)'}}>
          <div className="modal-dialog modal-lg" role="document" style={{maxWidth: '700px'}}>
            <div className="modal-content" style={{maxHeight: '90vh', minHeight: '400px', display: 'flex', flexDirection: 'column'}}>
              <form onSubmit={submitEdit} noValidate style={{height: '100%'}}>
                <div className="modal-header">
                  <h5 className="modal-title">Editar Producto</h5>
                  <button type="button" className="btn-close" onClick={() => setEditProd(null)}></button>
                </div>
                <div className="modal-body" style={{overflowY: 'auto', maxHeight: '65vh'}}>
                  {error && (
                    <div className="alert alert-danger mb-3" style={{fontSize: '1em'}}>{error}</div>
                  )}
                  <div className="mb-2">
                    <label>Nombre</label>
                    <input type="text" className={`form-control${editFieldErrors.nombre ? ' is-invalid' : ''}`} name="nombre" value={form.nombre} onChange={handleChange} required />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {editFieldErrors.nombre && <span className="invalid-feedback d-block">{editFieldErrors.nombre}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Descripción</label>
                    <input type="text" className={`form-control${editFieldErrors.descripcion ? ' is-invalid' : ''}`} name="descripcion" value={form.descripcion} onChange={handleChange} required />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {editFieldErrors.descripcion && <span className="invalid-feedback d-block">{editFieldErrors.descripcion}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Precio</label>
                    <input type="number" className={`form-control${editFieldErrors.precio ? ' is-invalid' : ''}`} name="precio" value={form.precio} onChange={handleChange} required min="0" />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {editFieldErrors.precio && <span className="invalid-feedback d-block">{editFieldErrors.precio}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Stock</label>
                    <input type="number" className={`form-control${editFieldErrors.stockTotal ? ' is-invalid' : ''}`} name="stockTotal" value={form.stockTotal} onChange={handleChange} required min="0" />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
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

      {/* Modal Borrado */}
      {deleteProd && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{background: 'rgba(0,0,0,0.3)'}}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar producto?</h5>
                <button type="button" className="btn-close" onClick={() => { setDeleteProd(null); setDeleteError(null); }}></button>
              </div>
              <div className="modal-body">
                {deleteError && <div className="alert alert-danger mb-2">{deleteError}</div>}
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
    </div>
  );
}

export default Productos;