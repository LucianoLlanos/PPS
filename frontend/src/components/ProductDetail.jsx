import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { Box, Typography, Chip, Button, Divider, Skeleton } from '@mui/material';
import ProductImageCarousel from './ProductImageCarousel';
import { formatCurrency } from '../utils/format';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const preloaded = location.state?.product || null;
  const [producto, setProducto] = useState(preloaded);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Al navegar a detalle, forzar scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let mounted = true;
    setLoading(true);
    // Si ya tenemos el producto pre-cargado desde navegación, evitar fetch inicial
    if (preloaded) { setLoading(false); return () => { mounted=false; }; }
    api.get(`/productos/${id}`)
      .then(res => { if(mounted){ setProducto(res.data); }})
      .catch(() => { if(mounted){ setError('No se encontró el producto'); }})
      .finally(() => { if(mounted){ setLoading(false); }});
    return () => { mounted = false; };
  }, [id, preloaded]);

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1100, mx: 'auto', py: 4, px: 2 }}>
        <Skeleton variant="rectangular" height={380} sx={{ mb: 3, borderRadius: 3 }} />
        <Skeleton width={260} height={40} />
        <Skeleton width={180} height={32} sx={{ mt: 1 }} />
        <Skeleton width="100%" height={120} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error && !producto) {
    return <Box sx={{ textAlign: 'center', py: 6 }}><Typography color="error">{error}</Typography></Box>;
  }

  if (!producto) return null;

  const { nombre, precio, descripcion, stock, imagenes } = producto;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 4, px: 2 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Volver</Button>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        <Box sx={{ flex: 1, minWidth: 320 }}>
          <ProductImageCarousel imagenes={imagenes} nombre={nombre} stock={stock} minimal={false} height={360} />
        </Box>
        <Box sx={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.8px' }}>{nombre}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>{formatCurrency(precio)}</Typography>
          <Chip label={stock > 0 ? `Stock disponible: ${stock}` : 'Sin stock'} color={stock > 0 ? 'default' : 'error'} variant={stock > 0 ? 'outlined' : 'filled'} sx={{ alignSelf: 'start' }} />
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.5, fontSize: '0.95rem' }}>{descripcion}</Typography>
          <Box sx={{ mt: 'auto', pt: 3 }}>
            <Button variant="contained" size="large" startIcon={<AddShoppingCartIcon />} disabled={stock <= 0}>Agregar al carrito</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
