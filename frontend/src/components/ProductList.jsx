import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ProductList({ onEdit }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/seller/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const h = () => fetch();
    window.addEventListener('product:saved', h);
    return () => window.removeEventListener('product:saved', h);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Eliminar producto?')) return;
    try {
      await api.delete('/seller/products/' + id);
      fetch();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  if (loading) return <div>Cargando productos...</div>;

  return (
    <div>
      <h3>Productos</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Imagen</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.price}</td>
              <td>{p.stock}</td>
              <td>{p.image ? <img src={api.defaults.baseURL + '/uploads/' + p.image} alt="img" width={80} /> : '—'}</td>
              <td>
                <button onClick={() => onEdit && onEdit(p)}>Editar</button>
                <button onClick={() => handleDelete(p.id)} style={{ marginLeft: 6 }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
