import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ProductForm({ onSaved, editingProduct, clearEditing }) {
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        price: editingProduct.price || '',
        stock: editingProduct.stock || '',
      });
      setFile(null);
    } else {
      setForm({ name: '', description: '', price: '', stock: '' });
      setFile(null);
    }
  }, [editingProduct]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('stock', form.stock);
      if (file) fd.append('image', file);

      let res;
      if (editingProduct && editingProduct.id) {
        res = await api.put('/seller/products/' + editingProduct.id, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Producto actualizado');
      } else {
        res = await api.post('/seller/products', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('Producto creado');
      }
      setForm({ name: '', description: '', price: '', stock: '' });
      setFile(null);
      if (onSaved) onSaved(res.data);
      if (clearEditing) clearEditing();
    } catch (err) {
      console.error(err);
      alert('Error al guardar producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      <h3>{editingProduct ? 'Editar Producto' : 'Crear Producto'}</h3>
      <div>
        <input name="name" placeholder="Nombre" value={form.name} onChange={handleChange} required />
      </div>
      <div>
        <input name="description" placeholder="Descripción" value={form.description} onChange={handleChange} />
      </div>
      <div>
        <input name="price" placeholder="Precio" value={form.price} onChange={handleChange} type="number" step="0.01" />
      </div>
      <div>
        <input name="stock" placeholder="Stock" value={form.stock} onChange={handleChange} type="number" />
      </div>
      <div>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      </div>
      <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
      {editingProduct && <button type="button" onClick={clearEditing} style={{ marginLeft: 8 }}>Cancelar</button>}
    </form>
  );
}
