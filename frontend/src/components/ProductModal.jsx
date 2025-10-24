import React from 'react';
import { formatCurrency } from '../utils/format';
import { useNavigate } from 'react-router-dom';
import cart from '../utils/cart';
import useAuthStore from '../store/useAuthStore';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

export default function ProductModal({ product, onClose, onAdded }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  if (!product) return null;

  const title = product.nombre || product.name;
  const desc = product.descripcion || product.description || '';
  const price = Number(product.precio || product.price || 0);
  const img = product.imagen || product.image;

  const handleAdd = () => {
    if (!user) {
      onClose(); // Cerrar modal primero
      if (onAdded) onAdded(`⚠️ Inicia sesión para agregar productos al carrito`, 'warning');
      setTimeout(() => { navigate('/login'); }, 800);
      return;
    }
    if (Number(user.idRol) === 3) {
      // Administradores no pueden agregar al carrito
      if (onAdded) onAdded('⚠️ Los administradores no pueden usar el carrito', 'warning');
      onClose();
      return;
    }
    cart.addToCart(product, 1);
    if (onAdded) onAdded(`✅ ${title} agregado al carrito`, 'success');
    onClose();
  };

  const src = img ? `http://localhost:3000/uploads/${img}` : '/img/descarga.jpg';

  return (
    <Dialog open={!!product} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={src} alt={title} style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} onError={(e) => e.target.src = '/img/descarga.jpg'} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{desc}</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 18, mt: 2 }}>{formatCurrency(price)}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cerrar</Button>
        <Button onClick={handleAdd} variant="contained">Agregar al carrito</Button>
      </DialogActions>
    </Dialog>
  );
}
