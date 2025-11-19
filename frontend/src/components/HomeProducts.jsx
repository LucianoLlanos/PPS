import React, { useEffect, useState, useMemo } from 'react';
import { ProductsService } from '../services/ProductsService';
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
import { Box, Grid, Typography, Button, Chip, Stack, Divider } from '@mui/material';
import useSnackbarStore from '../store/useSnackbarStore';
import ProductCardModern from './ProductCardModern';

export default function HomeProducts() {
  const productsService = useMemo(() => new ProductsService(), []);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('Todos');
  const perPage = 12;
  const [selected, setSelected] = useState(null);
  const [expandedMap, setExpandedMap] = useState({});
  const [canToggleMap, setCanToggleMap] = useState({});
  
  const snackbar = useSnackbarStore();

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  
  // Favoritos
  const { toggleFavorite, isFavorite, loading: favoritesLoading } = useFavoritesStore();

  // (insertBreaks removed) ProductCardClean handles long words now

  const showToastNotification = (message, type = 'success') => {
    snackbar.show(message, type === 'warning' ? 'warning' : 'success');
  };

  const fetch = async () => {
  // debug counter removed
    setLoading(true);
    try {
      const list = await productsService.listPublic();
      setProductos(Array.isArray(list) ? list : []);
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
    const cat = params.get('cat') || 'Todos';
    setQuery(q);
    setCategory(cat);
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

  const normalizeCategory = (p) => {
    const raw = (p.categoria || p.category || '').toString().trim();
    if (raw) return raw;
    const text = `${p.nombre || ''} ${p.descripcion || ''}`.toLowerCase();
    if (text.includes('bomba')) return 'Bombas de agua';
    if (text.includes('tanque')) return 'Tanques de agua';
    if (text.includes('solar') || text.includes('panel')) return 'Energía solar';
    if (text.includes('saneamiento') || text.includes('cloaca')) return 'Saneamiento';
    if (text.includes('agua')) return 'Agua';
    return 'Otros';
  };

  const categories = React.useMemo(() => {
    const set = new Set();
    (productos || []).forEach((p) => set.add(normalizeCategory(p)));
    const all = Array.from(set).filter(Boolean);
    const hasOtros = all.includes('Otros');
    const withoutOtros = all.filter((c) => c !== 'Otros').sort((a,b)=>a.localeCompare(b));
    return ['Todos', ...withoutOtros, ...(hasOtros ? ['Otros'] : [])];
  }, [productos]);

  const filtered = productos.filter(p => {
    const text = (p.nombre || p.name || '').toString().toLowerCase() + ' ' + (p.descripcion || p.description || '').toString().toLowerCase();
    const byText = text.includes(query.toLowerCase());
    if (!byText) return false;
    if (category === 'Todos') return true;
    return normalizeCategory(p) === category;
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
    
    // Validar stock disponible
    const stockDisponible = Number(p.stock || 0);
    if (stockDisponible <= 0) {
      showToastNotification(`⚠️ ${p.nombre} sin stock disponible`, 'error');
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
      overflow: 'hidden',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      mt: 0,
      pt: 0
    }}>
      {/* Carrusel de banners publicitarios - ocupa todo el ancho */}
      <CarouselBanner />

      {/* Título de la empresa */}
      <CompanyTitle />

      {/* Sección Catálogo con degradado suave */}
      <Box sx={{
        width: '100%',
        background: 'linear-gradient(180deg, #f8fbff 0%, #f2f7ff 55%, #eef5ff 100%)',
        py: { xs: 3, md: 4 },
        pt: { xs: 3.25, md: 4.75 },
      }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: '-0.6px', color: '#0b1b2b' }}>Catálogo</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Equipamientos y soluciones en energía, agua y saneamiento
          </Typography>

          {categories.length > 1 && (
            <Box sx={{ mb: 2.5, position: 'relative' }}>
              <Stack direction="row" spacing={0.75} sx={{ overflowX: 'auto', pb: 0.5, px: 2 }}>
                {categories.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    clickable
                    size="small"
                    color={c === category ? 'primary' : 'default'}
                    variant={c === category ? 'filled' : 'outlined'}
                    onClick={() => {
                      setCategory(c);
                      setPage(1);
                      try {
                        const params = new URLSearchParams(location.search);
                        if (c && c !== 'Todos') params.set('cat', c); else params.delete('cat');
                        if (!params.get('q')) params.delete('q');
                        window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
                      } catch {}
                    }}
                    sx={{
                      borderRadius: 999,
                      fontWeight: 700,
                      px: 1.25,
                      height: 28,
                      letterSpacing: '-0.1px'
                    }}
                  />
                ))}
                {category !== 'Todos' && (
                  <Chip
                    label="Limpiar"
                    size="small"
                    onClick={() => {
                      setCategory('Todos');
                      setPage(1);
                      try {
                        const params = new URLSearchParams(location.search);
                        params.delete('cat');
                        if (!params.get('q')) params.delete('q');
                        window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
                      } catch {}
                    }}
                    sx={{ borderRadius: 999, fontWeight: 700, px: 1.25, height: 28 }}
                  />
                )}
              </Stack>
              {/* Fade edges para hint de scroll horizontal en mobile */}
              <Box sx={{ pointerEvents: 'none', position: 'absolute', left: 0, top: 0, bottom: 0, width: 18, background: 'linear-gradient(to right, #f2f7ff 30%, rgba(242,247,255,0))', zIndex: 2 }} />
              <Box sx={{ pointerEvents: 'none', position: 'absolute', right: 0, top: 0, bottom: 0, width: 18, background: 'linear-gradient(to left, #f2f7ff 30%, rgba(242,247,255,0))', zIndex: 2 }} />
              <Divider sx={{ mt: 1 }} />
            </Box>
          )}

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

      {/* Notificación global movida a GlobalSnackbar mounted en App.jsx */}

      {/* Footer */}
      <Footer />
    </Box>
  );
}
