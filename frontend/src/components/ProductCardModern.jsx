import React, { useState } from 'react';
import { Card, Box, Typography, IconButton, Tooltip, Fade, Chip, Dialog, DialogContent, DialogTitle } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatCurrency } from '../utils/format';
import '../stylos/ProductCardModern.css';
import ProductImageCarousel from './ProductImageCarousel';

// Card moderna y minimalista para catálogo
export default function ProductCardModern({ product, onAdd, onView, onToggleFavorite, isFavorite }) {
  const precio = Number(product.precio || product.price || 0);
  const stock = Number(product.stock ?? product.stockTotal ?? 0);
  const imagenes = product.imagenes || (product.imagen ? [product.imagen] : []);
  const nombre = product.nombre || product.name || 'Producto';
  const descripcion = product.descripcion || product.description || '';

  // Truncar descripción de forma minimalista
  const [openDesc, setOpenDesc] = useState(false);
  const maxLines = 6; // líneas visibles antes de cortar
  const showToggle = descripcion && descripcion.length > 0 && descripcion.split(' ').length > 12;
  const handleOpenDesc = () => setOpenDesc(true); // Open description modal
  const handleCloseDesc = () => setOpenDesc(false); // Close description modal

  const handleCardClick = () => {
    if (openDesc) return;
    onView();
  };

  return (
    <Card
      className="product-card-modern"
      onClick={handleCardClick}
      sx={{
        width: 246,
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        bgcolor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.08)',
        transition: 'box-shadow .28s ease, transform .28s ease',
        cursor: 'pointer',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 6px 20px -2px rgba(0,0,0,0.18)',
          transform: 'translateY(-4px)'
        }
      }}
    >
      <Box sx={{ position: 'relative', height: 180, overflow: 'hidden', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <ProductImageCarousel imagenes={imagenes} nombre={nombre} stock={stock} minimal={true} />
        {/* Overlay acciones */}
        <Fade in timeout={250}>
          <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Tooltip title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'} placement="left">
              <IconButton size="small" onClick={(e)=>{ e.stopPropagation(); onToggleFavorite(); }} sx={{ bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' } }}>
                {isFavorite ? <FavoriteIcon color="error" fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Ver detalle" placement="left">
              <IconButton size="small" onClick={(e)=>{ e.stopPropagation(); onView(); }} sx={{ bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' } }}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={stock > 0 ? 'Agregar al carrito' : 'Sin stock'} placement="left">
              <span>
                <IconButton size="small" disabled={stock <= 0} onClick={(e)=>{ e.stopPropagation(); onAdd(); }} sx={{ bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' } }}>
                  <AddShoppingCartIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Fade>
        {stock <= 0 && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" sx={{ bgcolor: 'error.main', color: '#fff', px: 1.5, py: 0.5, borderRadius: 2 }}>Sin stock</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.75, flexGrow: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.15, minHeight: 38, letterSpacing: '-0.3px' }}>
          {nombre}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.55px', mb: 0.75 }}>{formatCurrency(precio)}</Typography>
        <Box sx={{ position: 'relative', flexGrow: 1, mb: 0.5 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: maxLines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '0.78rem',
              lineHeight: 1.3,
              pr: 0.5
            }}
          >
            {descripcion}
          </Typography>
          {!openDesc && showToggle && (
            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          )}
          {showToggle && (
            <Box sx={{ mt: 0.25 }}>
              <Typography
                component="button"
                onClick={(e) => { e.stopPropagation(); handleOpenDesc(); }}
                sx={{ p: 0, m: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
              >
                Ver más
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Chip label={stock > 0 ? `Stock ${stock}` : 'Agotado'} size="small" color={stock > 0 ? 'default' : 'error'} variant={stock > 0 ? 'outlined' : 'filled'} sx={{ fontSize: '0.65rem', bgcolor: stock > 0 ? 'rgba(0,0,0,0.03)' : undefined }} />
        </Box>
        <Dialog open={openDesc} disableScrollLock onClose={(e)=>{ e.stopPropagation(); handleCloseDesc(); }} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, pr: 5, borderBottom: '1px solid #e5e9ef' }}>
            {nombre}
            <IconButton onClick={handleCloseDesc} size="small" sx={{ position: 'absolute', top: 6, right: 6 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 1.2, background: 'linear-gradient(135deg,#ffffff 0%,#f3f6f9 100%)' }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>{formatCurrency(precio)}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', fontSize: '0.82rem', lineHeight: 1.4 }}>
              {descripcion}
            </Typography>
          </DialogContent>
        </Dialog>
      </Box>
    </Card>
  );
}
