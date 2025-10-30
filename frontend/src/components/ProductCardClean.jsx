import React from 'react';
import { Card, CardContent, CardActions, Box, Typography, IconButton, Button, Chip } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ProductImageCarousel from './ProductImageCarousel';
import ExpandableText from './ExpandableText';

// Small, robust card used to replace the messy original
export default function ProductCardClean({ product, onView, onAdd }) {
  const title = product.nombre || product.name || 'Producto';
  const desc = product.descripcion || product.description || '';
  const price = Number(product.precio || product.price || 0);
  // `product.imagenes` ya se pasa directamente al carousel; no necesitamos `img` aquí

  

  return (
  <Card sx={{ position: 'relative', width: 320, maxWidth: 320, height: 460, display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: 3, overflow: 'hidden', boxSizing: 'border-box', mx: 'auto', flexShrink: 0 }}>
      <Box sx={{ width: '100%', height: 200, overflow: 'hidden', bgcolor: '#f6f6f6', flexShrink: 0 }}>
        <ProductImageCarousel imagenes={product.imagenes || product.imagen || product.image} nombre={title} />
      </Box>

  <CardContent sx={{ pt: 2, px: 2, height: 150, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Typography>
            <Box sx={{ display: 'block', minWidth: 0, height: '72px', overflow: 'hidden' }}>
              <ExpandableText text={desc} lines={3} className="product-card-desc" useModal={true} hideToggle={false} />
              {/* Keep the modal opener for backward compatibility in case user clicks the card actions */}
            </Box>
            </Box>
            <Box sx={{ ml: 1, textAlign: 'right', flexShrink: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)}</Typography>
            </Box>
        </Box>
      </CardContent>

  <CardActions sx={{ position: 'absolute', left: 0, right: 0, bottom: 8, px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', height: 50 }}>
        <Box>
          <IconButton size="small" onClick={() => onView && onView(product)} aria-label="ver"><VisibilityIcon /></IconButton>
          <IconButton size="small" onClick={() => onAdd && onAdd(product)} color="primary" aria-label="agregar"><AddShoppingCartIcon /></IconButton>
        </Box>
        <Box>
          {product.stock !== undefined && <Chip label={product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'} size="small" />}
        </Box>
      </CardActions>
    </Card>
  );
}
