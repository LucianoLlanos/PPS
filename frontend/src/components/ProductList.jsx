import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/format';
import api from '../api/axios';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ProductList({ onEdit }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/seller/products');
      setProducts(res.data || []);
    } catch {
      // Error silencioso
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
    } catch {
      alert('Error al eliminar');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Productos</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Imagen</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{formatCurrency(Number(p.price || p.precio || 0))}</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell>{p.image ? <img src={api.defaults.baseURL + '/uploads/' + p.image} alt="img" width={80} /> : '—'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => onEdit && onEdit(p)} aria-label="editar"><EditIcon /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(p.id)} aria-label="eliminar"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
