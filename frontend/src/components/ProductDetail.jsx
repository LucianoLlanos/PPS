import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { Box, Typography, Chip, Button, Divider, Skeleton, IconButton, Tooltip } from '@mui/material';
import ProductImageCarousel from './ProductImageCarousel';
import { formatCurrency } from '../utils/format';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import cart from '../utils/cart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import useFavoritesStore from '../store/useFavoritesStore';
import useSnackbarStore from '../store/useSnackbarStore';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const preloaded = location.state?.product || null;
  const [producto, setProducto] = useState(preloaded);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Mover hooks antes de cualquier return condicional para mantener el orden estable
  const [pulse, setPulse] = useState(false);
  // IMPORTANTE: llamar hooks siempre antes de cualquier return condicional
  const favoritesStore = useFavoritesStore();
  const snackbar = useSnackbarStore();

  // Leer usuario desde localStorage para evitar hooks extra
  const getUserLocal = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (preloaded) return; // ya lo tenemos
        const res = await api.get(`/productos/${id}`);
        if (mounted) setProducto(res.data);
      } catch (e) {
        if (mounted) setError('No se encontró el producto');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    // si viene precargado, no fetch
    if (preloaded) {
      setLoading(false);
    } else {
      load();
    }
    return () => { mounted = false; };
  }, [id, preloaded]);

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1100, mx: 'auto', py: 4, px: 2 }}>
        <Skeleton variant="rectangular" height={380} sx={{ mb: 3, borderRadius: 0 }} />
        <Skeleton width={260} height={36} />
        <Skeleton width={180} height={28} sx={{ mt: 1 }} />
      </Box>
    );
  }

  if (error && !producto) {
    return <Box sx={{ textAlign: 'center', py: 6 }}><Typography color="error">{error}</Typography></Box>;
  }

  if (!producto) return null;

  const { nombre, precio, descripcion, stock } = producto;
  const productId = producto?.idProducto || producto?.id;
  // Normalizar imágenes: usar `imagenes` (array o string) o caer a `imagen`
  const imgs = producto?.imagenes;
  const imagenesToShow = Array.isArray(imgs)
    ? imgs
    : (typeof imgs === 'string' && imgs.trim())
      ? [imgs]
      : (producto?.imagen ? [producto.imagen] : []);

  const handleAddToCart = () => {
    const user = getUserLocal();
    if (!user) {
      navigate('/login');
      return;
    }
    if (Number(user.idRol) === 3) return;
    cart.addToCart(producto, 1);
    snackbar.show('Producto agregado al carrito', 'success');
  };

  // Favoritos
  const isFav = productId ? favoritesStore.isFavorite(productId) : false;
  const handleToggleFavorite = async () => {
    const user = getUserLocal();
    if (!user) { navigate('/login'); return; }
    if (!producto) return;
    setPulse(true); setTimeout(()=>setPulse(false), 420);
    await favoritesStore.toggleFavorite(producto);
  };

  return (
    <Box sx={{ maxWidth: 1160, mx: 'auto', py: 4, px: 2 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Volver</Button>
      <Box sx={{
        background: '#fff',
        border: '1px solid #e5e9ef',
        borderRadius: 0,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
        alignItems: 'stretch',
        overflow: 'hidden'
      }}>
        <Box sx={{ p: { xs: 1.25, md: 1.75 } }}>
          <ProductImageCarousel imagenes={imagenesToShow} nombre={nombre} stock={stock} minimal={true} height={380} pauseOnHover={false} />
        </Box>
        <Box sx={{
          borderLeft: { md: '1px solid #e5e9ef' },
          p: { xs: 2, md: 3 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0b1b2b', letterSpacing: '-0.8px' }}>{nombre}</Typography>
            <Tooltip title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
              <IconButton onClick={handleToggleFavorite} sx={{ bgcolor: 'rgba(0,0,0,0.04)', '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' } }}>
                {isFav ? <FavoriteIcon className={pulse ? 'fav-pulse' : ''} color="error" /> : <FavoriteBorderIcon className={pulse ? 'fav-pulse' : ''} />}
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.6px' }}>{formatCurrency(precio)}</Typography>
          <Chip label={stock > 0 ? `Stock disponible: ${stock}` : 'Sin stock'} color={stock > 0 ? 'default' : 'error'} variant={stock > 0 ? 'outlined' : 'filled'} sx={{ alignSelf: 'start' }} />
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.55, fontSize: '0.95rem', color: 'text.secondary' }}>{descripcion}</Typography>
          <Box sx={{ mt: 'auto' }}>
            <Button fullWidth variant="contained" size="large" startIcon={<AddShoppingCartIcon />} disabled={stock <= 0} onClick={handleAddToCart} sx={{ py: 1.2, fontWeight: 800, borderRadius: 0 }}>
              Agregar al carrito
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
