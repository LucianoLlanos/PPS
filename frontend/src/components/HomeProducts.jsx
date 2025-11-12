import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductModal from './ProductModal';
import ProductImageCarousel from './ProductImageCarousel';
import ExpandableText from './ExpandableText';
import CarouselBanner from './CarouselBanner';
import CompanyTitle from './CompanyTitle';
import Footer from './Footer';
import '../stylos/HomeProducts.css';
// import ProductCardClean from './ProductCardClean';
import cart from '../utils/cart';
import { formatCurrency } from '../utils/format';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useFavoritesStore from '../store/useFavoritesStore';
import { Box, Grid, Card, CardContent, CardActions, Typography, Button, Snackbar, Alert, CardMedia, IconButton } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

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
        <Grid container spacing={3} sx={{ mb: 2, justifyContent: 'center', alignItems: 'flex-start' }}>
            {itemsToRender.map((p, idx) => {
              const isNew = idx === itemsToRender.length - 1;
              return (
                <Grid item key={p.idProducto || p.id || idx} xs={12} sm={6} md={isNew ? 6 : 4} lg={isNew ? 6 : 3} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Card className="product-card"
                    sx={{
                      borderRadius: 3,
                      boxShadow: 3,
                      height: 480, /* fixed height so all cards match */
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                      '&:hover': { transform: 'translateY(-6px)', boxShadow: 8 },
                      overflow: 'hidden',
                      width: 280,
                      minWidth: 280,
                      maxWidth: 280,
                      position: 'relative'
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Box sx={{ width: '100%', height: 220, backgroundColor: '#f6f6f6', display: 'block', overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                        <ProductImageCarousel imagenes={p.imagenes || (p.imagen ? [p.imagen] : [])} nombre={p.nombre || p.name} stock={p.stock} showNameOnly={true} />
                      </Box>
                      {/* Name overlay and stock chip are rendered inside ProductImageCarousel now; keep image area clean */}
                    </Box>

                    <CardContent className="product-card-content" sx={{ flex: '1 1 auto', pt: 2, pb: 10, display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{formatCurrency(Number(p.precio || p.price || 0))}</Typography>
                      <div>
                        <ExpandableText
                          text={p.descripcion || ''}
                          lines={3}
                          className="product-expandable"
                          useModal={false}
                          hideToggle={true}
                          expanded={!!expandedMap[p.idProducto || p.id]}
                          onToggle={(next) => setExpandedMap(m => ({ ...m, [p.idProducto || p.id]: next }))}
                          onCanToggle={(available) => {
                            const key = (p.idProducto || p.id);
                            setCanToggleMap(m => {
                              // if value unchanged, avoid creating a new object to prevent re-renders
                              if (m && m[key] === available) return m;
                              const next = { ...m, [key]: available };
                              // if it's no longer available, also ensure we close expanded state
                              if (!available) {
                                setExpandedMap(em => {
                                  if (!em || !em[key]) return em;
                                  const copy = { ...em };
                                  delete copy[key];
                                  return copy;
                                });
                              }
                              return next;
                            });
                          }}
                        />
                      </div>
                    </CardContent>

                    <CardActions className="product-card-actions" sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 56, position: 'absolute', left: 12, right: 12, bottom: 12 }}>
                      <Box>
                        <IconButton size="small" onClick={() => setSelected(p)} aria-label="ver" sx={{ mr: 1 }}>
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => add(p)} 
                          color="primary" 
                          aria-label="agregar"
                          disabled={!p.stock || Number(p.stock) <= 0}
                          title={!p.stock || Number(p.stock) <= 0 ? 'Sin stock' : 'Agregar al carrito'}
                        >
                          <AddShoppingCartIcon />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Toggle moved to the actions bar so it doesn't push icons. Show only when needed. */}
                        {canToggleMap[p.idProducto || p.id] && (
                          <Button size="small" onClick={() => setExpandedMap(m => ({ ...m, [p.idProducto || p.id]: !m[p.idProducto || p.id] }))}>
                            {expandedMap[p.idProducto || p.id] ? 'Mostrar menos' : 'Leer más'}
                          </Button>
                        )}
                        <IconButton 
                          size="small" 
                          aria-label="fav" 
                          onClick={() => {
                            if (!user) {
                              showToastNotification('Debes iniciar sesión para agregar favoritos', 'warning');
                              return;
                            }
                            toggleFavorite(p);
                          }}
                          disabled={favoritesLoading}
                          sx={{ 
                            bgcolor: 'rgba(0,0,0,0.04)',
                            color: isFavorite(p.idProducto || p.id) ? '#ff1744' : '#666',
                            '&:hover': {
                              color: isFavorite(p.idProducto || p.id) ? '#d50000' : '#ff1744'
                            }
                          }}
                        >
                          {isFavorite(p.idProducto || p.id) ? 
                            <FavoriteIcon fontSize="small" /> : 
                            <FavoriteBorderIcon fontSize="small" />
                          }
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
        </Grid>
      </Box>

      {itemsToRender.length === 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography align="center" color="text.secondary">No hay productos para mostrar</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', mt: 2 }}>
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
