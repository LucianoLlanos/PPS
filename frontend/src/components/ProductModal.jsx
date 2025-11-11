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
    <Dialog 
      open={!!product} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '80vh',
          overflowX: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        pb: 1,
        px: 2,
        wordBreak: 'break-word'
      }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2, 
        p: 3,
        overflowX: 'hidden',
        overflowY: 'auto'
      }}>
        {/* Imagen del producto */}
        <Box sx={{ 
          width: '100%', 
          maxWidth: '300px',
          height: 250, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: '#f8f9fa',
          borderRadius: 2,
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <img 
            src={src} 
            alt={title} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain',
              borderRadius: 8 
            }} 
            onError={(e) => e.target.src = '/img/descarga.jpg'} 
          />
        </Box>
        
        {/* Descripción */}
        <Box sx={{ 
          width: '100%', 
          textAlign: 'left',
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        }}>
          <Typography 
            variant="body1" 
            sx={{ 
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: 1.6,
              color: 'text.secondary',
              mb: 3,
              whiteSpace: 'normal'
            }}
          >
            {desc}
          </Typography>
          
          {/* Precio */}
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              textAlign: 'center',
              bgcolor: 'primary.50',
              py: 2,
              px: 3,
              borderRadius: 2,
              mb: 2,
              wordBreak: 'break-word'
            }}
          >
            {formatCurrency(price)}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" size="large">
          Cerrar
        </Button>
        <Button onClick={handleAdd} variant="contained" size="large">
          Agregar al carrito
        </Button>
      </DialogActions>
    </Dialog>
  );
}
