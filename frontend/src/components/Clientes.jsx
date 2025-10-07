import { useEffect, useState } from 'react';
import api from '../api/axios';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState(null);
  const [editCliente, setEditCliente] = useState(null);
  const [form, setForm] = useState({ direccion: '', telefono: '' });
  const [success, setSuccess] = useState(null);

  const load = () => {
    api.get('/clientes')
      .then(res => setClientes(res.data))
      .catch(() => setError('Error al obtener clientes'));
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (c) => {
    setEditCliente(c);
    setForm({ direccion: c.direccion || '', telefono: c.telefono || '' });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/clientes/${editCliente.idCliente}`, { direccion: form.direccion || null, telefono: form.telefono || null });
      setSuccess('Cliente actualizado');
      setEditCliente(null);
      load();
    } catch {
      setError('Error al actualizar cliente');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Clientes</h2>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>ID Cliente</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => (
              <tr key={c.idCliente}>
                <td>{c.idCliente}</td>
                <td>{c.nombre} {c.apellido}</td>
                <td>{c.email}</td>
                <td>{c.direccion || ''}</td>
                <td>{c.telefono || ''}</td>
                <td>
                  <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(c)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editCliente && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{background: 'rgba(0,0,0,0.3)'}}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <form onSubmit={submitEdit}>
                <div className="modal-header">
                  <h5 className="modal-title">Editar Cliente</h5>
                  <button type="button" className="btn-close" onClick={() => setEditCliente(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2">
                    <label>Dirección</label>
                    <input name="direccion" value={form.direccion} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="mb-2">
                    <label>Teléfono</label>
                    <input name="telefono" value={form.telefono} onChange={handleChange} className="form-control" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" type="submit">Guardar</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditCliente(null)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
