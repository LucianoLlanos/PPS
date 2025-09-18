import { useEffect, useState } from 'react';
import api from '../api/axios';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/usuarios')
      .then(res => setUsuarios(res.data))
      .catch(() => setError('Error al obtener usuarios'));
  }, []);

  return (
    <div className="mb-4">
      <h2 className="mb-3">Usuarios</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.idUsuario}>
                <td>{u.idUsuario}</td>
                <td>{u.nombre}</td>
                <td>{u.apellido}</td>
                <td>{u.email}</td>
                <td>{u.nombreRol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Usuarios;
