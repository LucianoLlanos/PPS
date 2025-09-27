import { useEffect, useState } from 'react';
import api from '../api/axios';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', idRol: '' });
  const [addUser, setAddUser] = useState(false);
  const [addForm, setAddForm] = useState({ nombre: '', apellido: '', email: '', password: '', idRol: '' });
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.get('/usuarios')
      .then(res => setUsuarios(res.data))
      .catch(() => setError('Error al obtener usuarios'));
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    // El error no se autocierra, solo el success
  }, [success]);

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({ nombre: user.nombre, apellido: user.apellido, email: user.email, idRol: user.idRol });
  };

  const handleDelete = (user) => {
    setDeleteUser(user);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Validación en tiempo real para edición
    if (e.target.value.trim() === '') {
      setEditFieldErrors({ ...editFieldErrors, [e.target.name]: 'Este campo es obligatorio' });
    } else {
      const newErrors = { ...editFieldErrors };
      delete newErrors[e.target.name];
      setEditFieldErrors(newErrors);
    }
    if (e.target.name === 'email') {
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(e.target.value)) {
        setEditFieldErrors({ ...editFieldErrors, email: 'Email inválido' });
      } else {
        const newErrors = { ...editFieldErrors };
        delete newErrors.email;
        setEditFieldErrors(newErrors);
      }
    }
  };
  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
    // Validación en tiempo real
    if (e.target.value.trim() === '') {
      setFieldErrors({ ...fieldErrors, [e.target.name]: 'Este campo es obligatorio' });
    } else {
      const newErrors = { ...fieldErrors };
      delete newErrors[e.target.name];
      setFieldErrors(newErrors);
    }
    if (e.target.name === 'email') {
      // Validación básica de email
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(e.target.value)) {
        setFieldErrors({ ...fieldErrors, email: 'Email inválido' });
      } else {
        const newErrors = { ...fieldErrors };
        delete newErrors.email;
        setFieldErrors(newErrors);
      }
    }
    if (e.target.name === 'password') {
      const value = e.target.value;
      if (value.length > 0 && value.length < 4) {
        setFieldErrors({ ...fieldErrors, password: 'La contraseña debe tener al menos 4 caracteres' });
      } else if (/\s/.test(value)) {
        setFieldErrors({ ...fieldErrors, password: 'La contraseña no puede contener espacios' });
      } else {
        const newErrors = { ...fieldErrors };
        delete newErrors.password;
        setFieldErrors(newErrors);
      }
    }
  };

  const submitEdit = (e) => {
    e.preventDefault();
    // Validación final antes de enviar
    const errors = {};
    const nombre = form.nombre.trim();
    const apellido = form.apellido.trim();
    if (!nombre) errors.nombre = 'El nombre es obligatorio';
    if (!apellido) errors.apellido = 'El apellido es obligatorio';
    if (!form.email.trim()) errors.email = 'El email es obligatorio';
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (form.email && !emailRegex.test(form.email)) errors.email = 'Email inválido';
    if (!form.idRol) errors.idRol = 'El rol es obligatorio';
    setEditFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    api.put(`/usuarios/${editUser.idUsuario}`, { ...form, nombre, apellido, idRol: form.idRol })
      .then(() => {
        setSuccess('Usuario actualizado correctamente');
        setEditUser(null);
        setEditFieldErrors({});
        setError(null);
      })
      .catch((err) => {
        let msg = 'Error al actualizar usuario';
        if (err.response && err.response.data && err.response.data.message) {
          msg = err.response.data.message;
        }
        setError(msg);
      });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/usuarios/${deleteUser.idUsuario}`);
      setSuccess('Usuario eliminado correctamente');
      setDeleteUser(null);
      setDeleteError(null);
      setError(null);
    } catch (err) {
      let msg = 'Error al eliminar usuario';
      if (err && err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setDeleteError(msg);
    }
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    // Validación final antes de enviar
    const errors = {};
    const nombre = addForm.nombre.trim();
    const apellido = addForm.apellido.trim();
    if (!nombre) errors.nombre = 'El nombre es obligatorio';
    if (!apellido) errors.apellido = 'El apellido es obligatorio';
    if (!addForm.email.trim()) errors.email = 'El email es obligatorio';
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (addForm.email && !emailRegex.test(addForm.email)) errors.email = 'Email inválido';
    if (!addForm.password.trim()) errors.password = 'La contraseña es obligatoria';
    if (addForm.password && addForm.password.length < 4) errors.password = 'La contraseña debe tener al menos 4 caracteres';
    if (/\s/.test(addForm.password)) errors.password = 'La contraseña no puede contener espacios';
    if (!addForm.idRol) errors.idRol = 'El rol es obligatorio';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    // Enviar datos limpios
    const payload = {
      ...addForm,
      nombre,
      apellido,
      idRol: addForm.idRol
    };
    try {
      await api.post('/usuarios', payload);
      setSuccess('Usuario creado correctamente');
      setAddUser(false);
      setAddForm({ nombre: '', apellido: '', email: '', password: '', idRol: '' });
      setFieldErrors({});
      setError(null);
    } catch (err) {
      let msg = 'Error al crear usuario';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    }
  };

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Usuarios</h2>
        <button className="btn btn-success" onClick={() => setAddUser(true)}>
          <i className="bi bi-person-plus"></i> Agregar usuario
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
              <th>Apellido</th>
              <th>Email</th>
          <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.idUsuario}>
                <td>{u.idUsuario}</td>
                <td>{u.nombre}</td>
                <td>{u.apellido}</td>
                <td>{u.email}</td>
                <td>{u.nombreRol || u.idRol}</td>
                <td>
                  <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(u)}>
                    <i className="bi bi-pencil"></i> Editar
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u)}>
                    <i className="bi bi-trash"></i> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Alta */}
      {addUser && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{background: 'rgba(0,0,0,0.3)'}}>
          <div className="modal-dialog modal-lg" role="document" style={{maxWidth: '700px'}}>
            <div className="modal-content" style={{maxHeight: '90vh', minHeight: '400px', display: 'flex', flexDirection: 'column'}}>
              <form onSubmit={submitAdd} noValidate style={{height: '100%'}}>
                <div className="modal-header">
                  <h5 className="modal-title">Agregar Usuario</h5>
                  <button type="button" className="btn-close" onClick={() => setAddUser(false)}></button>
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
                    <label>Apellido</label>
                    <input type="text" className={`form-control${fieldErrors.apellido ? ' is-invalid' : ''}`} name="apellido" value={addForm.apellido} onChange={handleAddChange} required />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {fieldErrors.apellido && <span className="invalid-feedback d-block">{fieldErrors.apellido}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Email</label>
                    <input type="email" className={`form-control${fieldErrors.email ? ' is-invalid' : ''}`} name="email" value={addForm.email} onChange={handleAddChange} required />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {fieldErrors.email && <span className="invalid-feedback d-block">{fieldErrors.email}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Contraseña</label>
                    <input type="password" className={`form-control${fieldErrors.password ? ' is-invalid' : ''}`} name="password" value={addForm.password} onChange={handleAddChange} required />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {fieldErrors.password && <span className="invalid-feedback d-block">{fieldErrors.password}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Rol</label>
                    <select className={`form-select${fieldErrors.idRol ? ' is-invalid' : ''}`} name="idRol" value={addForm.idRol} onChange={handleAddChange} required>
                      <option value="">Selecciona un rol</option>
                      <option value={1}>Cliente</option>
                      <option value={2}>Admin</option>
                      <option value={3}>Superadmin</option>
                      <option value={4}>Vendedor</option>
                    </select>
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {fieldErrors.idRol && <span className="invalid-feedback d-block">{fieldErrors.idRol}</span>}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success">Crear usuario</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setAddUser(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edición */}
      {editUser && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{background: 'rgba(0,0,0,0.3)'}}>
          <div className="modal-dialog modal-lg" role="document" style={{maxWidth: '700px'}}>
            <div className="modal-content" style={{maxHeight: '90vh', minHeight: '400px', display: 'flex', flexDirection: 'column'}}>
              <form onSubmit={submitEdit} noValidate style={{height: '100%'}}>
                <div className="modal-header">
                  <h5 className="modal-title">Editar Usuario</h5>
                  <button type="button" className="btn-close" onClick={() => setEditUser(null)}></button>
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
                    <label>Apellido</label>
                    <input type="text" className={`form-control${editFieldErrors.apellido ? ' is-invalid' : ''}`} name="apellido" value={form.apellido} onChange={handleChange} required />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {editFieldErrors.apellido && <span className="invalid-feedback d-block">{editFieldErrors.apellido}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Email</label>
                    <input type="email" className={`form-control${editFieldErrors.email ? ' is-invalid' : ''}`} name="email" value={form.email} onChange={handleChange} required />
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {editFieldErrors.email && <span className="invalid-feedback d-block">{editFieldErrors.email}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Rol</label>
                    <select className={`form-select${editFieldErrors.idRol ? ' is-invalid' : ''}`} name="idRol" value={form.idRol} onChange={handleChange} required>
                      <option value="">Selecciona un rol</option>
                      <option value={1}>Cliente</option>
                      <option value={2}>Admin</option>
                      <option value={3}>Superadmin</option>
                      <option value={4}>Vendedor</option>
                    </select>
                    <div style={{minHeight: 18, fontSize: '0.85em'}}>
                      {editFieldErrors.idRol && <span className="invalid-feedback d-block">{editFieldErrors.idRol}</span>}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success">Guardar cambios</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Borrado */}
      {deleteUser && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{background: 'rgba(0,0,0,0.3)'}}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar usuario?</h5>
                <button type="button" className="btn-close" onClick={() => { setDeleteUser(null); setDeleteError(null); }}></button>
              </div>
              <div className="modal-body">
                {deleteError && <div className="alert alert-danger mb-2">{deleteError}</div>}
                <p>¿Estás seguro que quieres eliminar a <b>{deleteUser.nombre} {deleteUser.apellido}</b>? Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={async () => {
                  try {
                    await confirmDelete();
                    setDeleteError(null);
                  } catch (err) {
                    let msg = 'Error al eliminar usuario';
                    if (err && err.response && err.response.data && err.response.data.message) {
                      msg = err.response.data.message;
                    }
                    setDeleteError(msg);
                  }
                }}>Eliminar</button>
                <button className="btn btn-secondary" onClick={() => { setDeleteUser(null); setDeleteError(null); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;
