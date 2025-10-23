import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductModal from './ProductModal';
import ProductImageCarousel from './ProductImageCarousel';
import cart from '../utils/cart';
import { formatCurrency } from '../utils/format';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Box, Grid, Card, CardContent, CardActions, Typography, Button, Snackbar, Alert, CardMedia, Chip, IconButton } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

export default function HomeProducts() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [selected, setSelected] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  
  // Estados para notificaciones toast
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('success'); // 'success' o 'warning'

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  // Función para mostrar notificación toast
  const showToastNotification = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    // Ocultar después de 3 segundos
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const fetch = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/productos');
        setProductos(res.data || []);
      } catch (err) {
        console.error(err);
        // fallback
        res = await api.get('/seller/products');
        const normalized = (res.data || []).map(p => ({
          idProducto: p.id || p.idProducto,
          nombre: p.name || p.nombre,
          descripcion: p.description || p.descripcion,
          precio: p.price || p.precio,
          stock: p.stock || p.stockTotal,
          imagen: p.image || p.imagen,
        }));
        setProductos(normalized);
      }
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setQuery(q);
    fetch();
  }, [location.search]);

  const filtered = productos.filter(p => {
    const text = (p.nombre || p.name || '').toString().toLowerCase() + ' ' + (p.descripcion || p.description || '').toString().toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page-1)*perPage, page*perPage);

  

  const add = (p) => { 
    if (!user) {
      // Si no hay usuario logueado, mostrar mensaje y redirigir a registro
      showToastNotification(`⚠️ Inicia sesión para agregar productos al carrito`, 'warning');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }
    cart.addToCart(p, 1);
    // Mostrar notificación de éxito
    showToastNotification(`✅ ${p.nombre} agregado al carrito`, 'success');
  };

  const sampleProducts = [
    { idProducto: 's1', nombre: 'Ejemplo A', descripcion: 'Producto de ejemplo A', precio: 1000 },
    { idProducto: 's2', nombre: 'Ejemplo B', descripcion: 'Producto de ejemplo B', precio: 2000 },
    { idProducto: 's3', nombre: 'Ejemplo C', descripcion: 'Producto de ejemplo C', precio: 3000 },
  ];

  const itemsToRender = showExamples ? sampleProducts : visible;

  // loadExamples removed (no se usa)

  if (loading) return <Box sx={{ py: 6, textAlign: 'center' }}>Cargando productos...</Box>;
  if (error) return <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box sx={{ width: '100%', py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Catálogo de productos</Typography>
        <Button variant="outlined" size="small" onClick={() => setShowExamples(s => !s)} sx={{ borderRadius: 999, textTransform: 'none' }}>{showExamples ? 'Mostrar reales' : 'Mostrar ejemplos'}</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {itemsToRender.map((p, idx) => {
          const isNew = idx === itemsToRender.length - 1;
          return (
            <Grid item key={p.idProducto || p.id || idx} xs={12} sm={6} md={isNew ? 6 : 4} lg={isNew ? 6 : 3}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 3,
                height: '100%',
                minHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: 8 }
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ width: '100%', height: 220, backgroundColor: '#f6f6f6', display: 'block', overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                  <ProductImageCarousel imagenes={p.imagenes || (p.imagen ? [p.imagen] : [])} nombre={p.nombre || p.name} />
                </Box>
                <Chip label={p.stock ? `Stock: ${p.stock}` : 'Sin stock'} size="small" color={p.stock > 0 ? 'primary' : 'default'} sx={{ position: 'absolute', top: 12, left: 12, zIndex: 50, bgcolor: 'rgba(255,255,255,0.95)', fontWeight: 700 }} />
                <Box sx={{ position: 'absolute', left: 0, bottom: 0, right: 0, p: 1.5, background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)', color: '#fff' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{p.nombre}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', opacity: 0.95 }}>{(p.descripcion || '').slice(0,80)}</Typography>
                </Box>
              </Box>

              <CardContent sx={{ flex: '0 0 auto', pt: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{formatCurrency(Number(p.precio || p.price || 0))}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{(p.descripcion || '').length > 120 ? ((p.descripcion || '').slice(0,120) + '...') : (p.descripcion || '')}</Typography>
              </CardContent>

              <CardActions sx={{ mt: 'auto', px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <IconButton size="small" onClick={() => setSelected(p)} aria-label="ver" sx={{ mr: 1 }}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => add(p)} color="primary" aria-label="agregar">
                    <AddShoppingCartIcon />
                  </IconButton>
                </Box>
                <IconButton size="small" aria-label="fav" sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                  <FavoriteBorderIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
            </Grid>
          );
        })}

        {itemsToRender.length === 0 && (
          <Grid item xs={12}><Typography align="center" color="text.secondary">No hay productos para mostrar</Typography></Grid>
        )}
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', mt: 2 }}>
        <Button disabled={page<=1} onClick={()=>setPage(page-1)} variant="outlined">Anterior</Button>
        <Typography> Página {page} / {totalPages} </Typography>
        <Button disabled={page>=totalPages} onClick={()=>setPage(page+1)} variant="outlined">Siguiente</Button>
      </Box>

      {selected && <ProductModal product={selected} onClose={()=>setSelected(null)} onAdded={(message, type) => { showToastNotification(message, type); }} />}

      <Snackbar open={showToast} autoHideDuration={3000} onClose={() => setShowToast(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setShowToast(false)} severity={toastType === 'success' ? 'success' : 'warning'} sx={{ width: '100%' }}>{toastMessage}</Alert>
      </Snackbar>
    </Box>
  );
}
