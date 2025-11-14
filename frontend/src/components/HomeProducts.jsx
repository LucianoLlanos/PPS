import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductModal from './ProductModal';
import ProductImageCarousel from './ProductImageCarousel';
import ExpandableText from './ExpandableText';
import CarouselBanner from './CarouselBanner';
import CompanyTitle from './CompanyTitle';
import Footer from './Footer';
import '../stylos/HomeProducts.css'; // mantener por compatibilidad, pero muchas clases ya no se usan
// import ProductCardClean from './ProductCardClean';
import cart from '../utils/cart';
import { formatCurrency } from '../utils/format';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useFavoritesStore from '../store/useFavoritesStore';
import { Box, Grid, Typography, Button, Snackbar, Alert } from '@mui/material';
import ProductCardModern from './ProductCardModern';

export default function HomeProducts() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [selected, setSelected] = useState(null);
  const [expandedMap, setExpandedMap] = useState({});
  const [canToggleMap, setCanToggleMap] = useState({});
  
  // Estados para notificaciones toast
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('success'); // 'success' o 'warning'

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  
  // Favoritos
  const { toggleFavorite, isFavorite, loading: favoritesLoading } = useFavoritesStore();

  // (insertBreaks removed) ProductCardClean handles long words now

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
  // debug counter removed
    setLoading(true);
    try {
      const res = await api.get('/productos');
      setProductos(res.data || []);
    } catch (_err) {
      console.error(_err);
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

  // Listen for live search events from SearchSection to update query without routing
  useEffect(() => {
    const onLive = (e) => {
      const q = e?.detail?.q || '';
      setQuery(q);
      // do not re-fetch products here; filtering is client-side
    };
    window.addEventListener('catalog:query', onLive);
    return () => window.removeEventListener('catalog:query', onLive);
  }, []);

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
    // prevent admin from adding to cart
    if (Number(user.idRol) === 3) {
      showToastNotification('⚠️ Los administradores no pueden usar el carrito', 'warning');
      return;
    }
    cart.addToCart(p, 1);
    // Mostrar notificación de éxito
    showToastNotification(`✅ ${p.nombre} agregado al carrito`, 'success');
  };

  const itemsToRender = visible;

  // Fondo sutil y separación de sección catálogo

  if (loading) return <Box sx={{ py: 6, textAlign: 'center' }}>Cargando productos...</Box>;
  if (error) return <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box sx={{ 
      width: '100%', 
      overflow: 'hidden', // Previene scroll horizontal
      maxWidth: '100vw',
      boxSizing: 'border-box',
      mt: 0, // Sin margen superior
      pt: 0  // Sin padding superior
    }}>
      {/* Carrusel de banners publicitarios - ocupa todo el ancho */}
      <CarouselBanner />

      {/* Título de la empresa */}
      <CompanyTitle />

      {/* Contenedor para el catálogo de productos */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, pt: 3, pb: 0 }}>
        <Grid container spacing={1.5} sx={{ mb: 1.5, justifyContent: 'center' }}>
          {itemsToRender.map((p, idx) => (
            <Grid item key={p.idProducto || p.id || idx} xs={6} sm={4} md={3} lg={3} sx={{ display: 'flex', justifyContent: 'center' }}>
              <ProductCardModern
                product={p}
                onAdd={() => add(p)}
                onView={() => navigate(`/productos/${p.idProducto || p.id}`, { state: { product: p } })}
                onToggleFavorite={() => {
                  if (!user) {
                    showToastNotification('Debes iniciar sesión para agregar favoritos', 'warning');
                    return;
                  }
                  toggleFavorite(p);
                }}
                isFavorite={isFavorite(p.idProducto || p.id)}
                canExpand={false}
                onToggleExpand={() => setExpandedMap(m => ({ ...m, [p.idProducto || p.id]: !m[p.idProducto || p.id] }))}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {itemsToRender.length === 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography align="center" color="text.secondary">No hay productos para mostrar</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', mt: 3, mb: 3 }}>
        <Button disabled={page<=1} onClick={()=>setPage(page-1)} variant="outlined">Anterior</Button>
        <Typography> Página {page} / {totalPages} </Typography>
        <Button disabled={page>=totalPages} onClick={()=>setPage(page+1)} variant="outlined">Siguiente</Button>
      </Box>

      {selected && <ProductModal product={selected} onClose={()=>setSelected(null)} onAdded={(message, type) => { showToastNotification(message, type); }} />}

      <Snackbar open={showToast} autoHideDuration={3000} onClose={() => setShowToast(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setShowToast(false)} severity={toastType === 'success' ? 'success' : 'warning'} sx={{ width: '100%' }}>{toastMessage}</Alert>
      </Snackbar>

      {/* Footer */}
      <Footer />
    </Box>
  );
}
