import { useEffect, useState } from 'react';
import api from '../api/axios';

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/ventas')
      .then(res => setPedidos(res.data))
      .catch(() => setError('Error al obtener pedidos'));
  }, []);

  return (
    <div className="mb-4">
      <h2 className="mb-3">Pedidos</h2>
      {error && <div className="alert alert-danger">{error}</div>}
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
                <td>{p.nombreUsuario}</td>
                <td>
                  {p.productos.map((prod, idx) => (
                    <div key={idx}>{prod.cantidad}</div>
                  ))}
                </td>
                <td>{new Date(p.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td>${p.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Pedidos;
