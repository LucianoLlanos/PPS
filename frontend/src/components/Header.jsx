import React, { useState, useRef, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { ProductsService } from '../services/ProductsService';
import { ServiciosService } from '../services/ServiciosService';
import useAuthStore from '../store/useAuthStore';
import useFavoritesStore from '../store/useFavoritesStore';
import { getCount, clearUserCart } from '../utils/cart';
import { AppBar, Toolbar, IconButton, Typography, Box, Badge, Button, TextField, InputAdornment, Paper, List, ListItem, ListItemButton, ListItemText, ClickAwayListener, Popper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MenuIcon from '@mui/icons-material/Menu';

export default function Header() {
  const brandUnderline = '#f7931e';
  const [cartCount, setCartCount] = useState(0);
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [activeSugIndex, setActiveSugIndex] = useState(-1); // índice seleccionado con teclado
  const timer = useRef(null);
  const searchAnchorRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  // seleccionar solo primitivos para evitar re-renders por referencia de objeto
  const userRole = useAuthStore((s) => s.user && s.user.idRol);
  const userNombre = useAuthStore((s) => s.user && s.user.nombre);
  const userApellido = useAuthStore((s) => s.user && s.user.apellido);
  const token = useAuthStore((s) => s.token);
  const [pendingServicios, setPendingServicios] = React.useState(0);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const location = useLocation();

  // Helper para evaluar ruta activa
  const isActivePath = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Estilo de links del header: sin fondo; brillo en texto al hover; subrayado cuando está activo
  const activeStyle = (path) => {
    const active = isActivePath(path);
    const afterBase = {
      content: '""',
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: 2,
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.9)',
      transform: 'scaleX(0)',
      transformOrigin: 'center',
      transition: 'transform .35s ease',
      pointerEvents: 'none'
    };
    const base = {
      textTransform: 'none',
      color: 'rgba(255,255,255,0.92)',
      borderRadius: 0,
      backgroundColor: 'transparent',
      transition: 'color .2s ease, text-shadow .2s ease',
      position: 'relative',
      '&::after': afterBase,
      '&:hover': {
        backgroundColor: 'transparent',
        color: '#fff',
        textShadow: '0 0 4px rgba(255,255,255,0.6)'
      },
      '&:hover::after': { transform: 'scaleX(1)' },
      '&:active': { backgroundColor: 'transparent' },
      '&.Mui-focusVisible': { 
        backgroundColor: 'transparent',
        outline: '2px solid rgba(255,255,255,0.9)',
        outlineOffset: '2px'
      }
    };
    if (!active) return base;
    return {
      ...base,
      color: '#fff',
      fontWeight: 700,
      textShadow: '0 0 4px rgba(255,255,255,0.5)',
      '&::after': { ...afterBase, transform: 'scaleX(1)', backgroundColor: brandUnderline },
      '&:hover::after': { transform: 'scaleX(1)', backgroundColor: brandUnderline }
    };
  };

  const productsService = React.useMemo(() => new ProductsService(), []);
  const serviciosService = React.useMemo(() => new ServiciosService(), []);

  useEffect(() => {
    setCartCount(getCount());
    const handleCartUpdate = (e) => setCartCount(e.detail.count);
    window.addEventListener('cart:updated', handleCartUpdate);
    let mounted = true;

    const fetchPendientes = async () => {
      // debug: contar ejecuciones en consola para detectar loops
  // debug counter removed
      // solo admins (rol 3) deben consultar pendientes
      if (!userRole || Number(userRole) !== 3) {
        if (mounted) setPendingServicios(0);
        return;
      }
      try {
        const all = await serviciosService.listAdmin();
        const pendientes = all.filter(s => s.estado === 'pendiente').length;
        if (mounted) setPendingServicios(pendientes);
      } catch {
        if (mounted) setPendingServicios(0);
      }
    };

    fetchPendientes();
    const intId = setInterval(fetchPendientes, 30000);
    const onFocus = () => fetchPendientes();
    window.addEventListener('focus', onFocus);
    const onServiciosUpdated = () => fetchPendientes();
    window.addEventListener('servicios:updated', onServiciosUpdated);
    return () => {
      window.removeEventListener('cart:updated', handleCartUpdate);
      mounted = false;
      clearInterval(intId);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('servicios:updated', onServiciosUpdated);
    };
  }, [userRole]);

  // Sync search query with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('q') || '';
    setQ(urlQuery);
  }, [location.search]);

  // Fetch suggestions for the search input
  const fetchSuggestions = async (text) => {
    if (!text || text.trim().length === 0) {
      setSuggestions([]);
      setShowSug(false);
      return;
    }
    try {
      const products = await productsService.listPublic();
      const items = (products || []).map(p => p.nombre || p.name || '');
      const filtered = items.filter(n => n.toLowerCase().includes(text.toLowerCase())).slice(0, 6);
      setSuggestions(filtered);
      setShowSug(true);
    } catch {
      setSuggestions([]);
      setShowSug(false);
    }
  };

  // Submit handler for the search form
  const submit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setShowSug(false);
    navigate(`/?q=${encodeURIComponent(q || '')}`);
  };

  const handleChange = (val) => {
    setQ(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const pickSuggestion = (s) => {
    setQ(s);
    setShowSug(false);
    navigate(`/?q=${encodeURIComponent(s)}`);
  };

  return (
    <AppBar
      position="sticky" // usar sticky para permanecer arriba y habilitar z-index
      elevation={2}
      sx={{
        top: 0,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(25,118,210,0.15)',
        zIndex: (theme) => theme.zIndex.drawer + 3, // mayor que drawer, modal y tooltip típicos del carrusel
        position: 'sticky'
      }}
    >
      <Toolbar sx={{ display: 'flex', gap: 2, py: 1.5, minHeight: 'auto' }}>
  <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                textDecoration: 'none',
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s ease'
                }
              }}
            >
              <Box
                component="img"
                src="/logo.jpeg"
                alt="Atilio Marola Logo"
                sx={{
                  height: { xs: 56, md: 64 },
                  width: { xs: 56, md: 64 },
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  display: { xs: 'none', sm: 'block' },
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                AtilioMarola
              </Typography>
            </Box>
          </Box>

          {/* Center area: render nav links, optional search and auth actions centered. Positioned absolute so it's centered relative to the page regardless of left/right content widths */}
          <Box sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            // absolute centering on md+ so it's aligned with the page center; fall back to normal flow on xs
            position: { xs: 'static', md: 'absolute' },
            left: { md: '50%' },
            transform: { md: 'translateX(calc(-50% - 12px))' }
          }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mr: { xs: 1, md: 3 } }}>
              {token && userRole && Number(userRole) === 3 && (
                <>
                  <Button component={RouterLink} to="/ventas-analytics" variant="text" size="small" disableRipple aria-current={isActivePath('/ventas-analytics') ? 'page' : undefined} sx={activeStyle('/ventas-analytics')}>Ventas</Button>
                  <Button component={RouterLink} to="/servicios-admin" variant="text" size="small" disableRipple aria-current={isActivePath('/servicios-admin') ? 'page' : undefined} startIcon={pendingServicios > 0 ? <Badge badgeContent={pendingServicios} color="error" sx={{ mr: 1 }} /> : null} sx={activeStyle('/servicios-admin')}>
                    Servicios
                  </Button>
                  <Button component={RouterLink} to="/productos" variant="text" size="small" disableRipple aria-current={isActivePath('/productos') ? 'page' : undefined} sx={activeStyle('/productos')}>Productos</Button>
                  <Button component={RouterLink} to="/usuarios" variant="text" size="small" disableRipple aria-current={isActivePath('/usuarios') ? 'page' : undefined} sx={activeStyle('/usuarios')}>Usuarios</Button>
                  <Button component={RouterLink} to="/pedidos" variant="text" size="small" disableRipple aria-current={isActivePath('/pedidos') ? 'page' : undefined} sx={activeStyle('/pedidos')}>Pedidos</Button>
                  <Button component={RouterLink} to="/clientes" variant="text" size="small" disableRipple aria-current={isActivePath('/clientes') ? 'page' : undefined} sx={activeStyle('/clientes')}>Clientes</Button>
                  <Button component={RouterLink} to="/empresa-admin" variant="text" size="small" disableRipple aria-current={isActivePath('/empresa-admin') ? 'page' : undefined} sx={activeStyle('/empresa-admin')}>Empresa</Button>
                  <Button component={RouterLink} to="/carousel-admin" variant="text" size="small" disableRipple aria-current={isActivePath('/carousel-admin') ? 'page' : undefined} sx={activeStyle('/carousel-admin')}>Carrusel</Button>
                </>
              )}

              {/* Ya no usamos panel aparte de vendedor; el flujo será desde el carrito */}

              {token && userRole && Number(userRole) !== 3 && Number(userRole) !== 2 && (
                <Button
                  component={RouterLink}
                  to="/servicios"
                  variant="text"
                  size="medium"
                  disableRipple
                  aria-current={isActivePath('/servicios') ? 'page' : undefined}
                  sx={{
                    ...activeStyle('/servicios'),
                    px: 1.5,
                    py: 0.75,
                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    borderRadius: 0,
                    color: 'rgba(255,255,255,0.95)',
                    transition: 'text-shadow 0.2s ease, color 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'transparent !important',
                      color: '#ffffff',
                      textShadow: '0 0 8px rgba(255,255,255,0.8)'
                    },
                    '&:active': { backgroundColor: 'transparent' },
                    '&.Mui-focusVisible': { backgroundColor: 'transparent' }
                  }}
                >
                  Servicios
                </Button>
              )}
            </Box>

            {/* Buscador para usuarios no-admin */}
            {(!token || (userRole && Number(userRole) !== 3)) && (
              <Box component="form" onSubmit={submit} sx={{ flex: 1, maxWidth: 500, ml: { xs: 1, md: 1 }, mr: { xs: 1, md: 0 }, position: 'relative', zIndex: 2001 }} ref={searchAnchorRef}>
                <ClickAwayListener onClickAway={() => setShowSug(false)}>
                  <Box ref={searchAnchorRef}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Buscar productos..."
                      value={q}
                      onChange={(e) => handleChange(e.target.value)}
                      onFocus={() => { if (suggestions.length > 0) setShowSug(true); }}
                      inputRef={searchInputRef}
                      onKeyDown={(e) => {
                        if (!suggestions || suggestions.length === 0) return;
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setShowSug(true);
                          setActiveSugIndex((prev) => (prev + 1) % suggestions.length);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setShowSug(true);
                          setActiveSugIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                        } else if (e.key === 'Enter') {
                          if (showSug && activeSugIndex >= 0) {
                            e.preventDefault();
                            pickSuggestion(suggestions[activeSugIndex]);
                          }
                        } else if (e.key === 'Escape') {
                          setShowSug(false);
                          setActiveSugIndex(-1);
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255,255,255,0.9)',
                          borderRadius: 3,
                          '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main',
                              borderWidth: '2px'
                            }
                          },
                          '&:hover': {
                            bgcolor: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.light'
                            }
                          }
                        },
                        '& input': {
                          '&:focus': {
                            outline: 'none !important',
                            boxShadow: 'none !important'
                          }
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {q?.length > 0 && (
                              <IconButton
                                size="small"
                                aria-label="Limpiar búsqueda"
                                onClick={() => {
                                  setQ('');
                                  setSuggestions([]);
                                  setShowSug(false);
                                  setActiveSugIndex(-1);
                                  if (searchInputRef.current) searchInputRef.current.focus();
                                }}
                                sx={{ color: '#e53935', '&:hover': { color: '#c62828' } }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            )}
                            <Button type="submit" variant="contained" size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>Buscar</Button>
                          </InputAdornment>
                        )
                      }}
                    />

                    {showSug && suggestions && suggestions.length > 0 && (
                      <Popper open anchorEl={searchAnchorRef.current} placement="bottom-start" style={{ zIndex: 3000 }}>
                        <Paper sx={{ 
                          mt: 0.5,
                          borderRadius: 2,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          overflow: 'hidden',
                          width: searchAnchorRef.current ? searchAnchorRef.current.offsetWidth : undefined
                        }}>
                          <List dense role="listbox" aria-label="Sugerencias de búsqueda">
                            {suggestions.map((s, idx) => (
                              <ListItem key={idx} disablePadding>
                                <ListItemButton 
                                  onMouseDown={() => pickSuggestion(s)}
                                  onMouseEnter={() => setActiveSugIndex(idx)}
                                  role="option"
                                  aria-selected={idx === activeSugIndex}
                                  sx={{
                                    bgcolor: idx === activeSugIndex ? 'primary.main' : 'transparent',
                                    color: idx === activeSugIndex ? 'white' : 'inherit',
                                    '&:hover': {
                                      bgcolor: idx === activeSugIndex ? 'primary.main' : 'action.hover',
                                      color: idx === activeSugIndex ? 'white' : 'inherit'
                                    }
                                  }}
                                >
                                  <SearchIcon sx={{ mr: 2, color: idx === activeSugIndex ? 'inherit' : 'text.secondary', fontSize: '1rem' }} />
                                  <ListItemText primary={s} />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </Popper>
                    )}
                  </Box>
                </ClickAwayListener>
              </Box>
            )}



            {/* Centered auth buttons for guests (login/register) */}
            {!token && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 2 }}>
                <Button component={RouterLink} to="/login" variant="outlined" size="small"
                  sx={{ 
                    textTransform: 'none', 
                    px: 2, 
                    py: 0.6, 
                    borderRadius: 20, 
                    fontWeight: 600, 
                    color: 'white', 
                    borderColor: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}>
                  Login
                </Button>
                <Button component={RouterLink} to="/register" variant="contained" size="small"
                  sx={{ 
                    textTransform: 'none', 
                    px: 2.2, 
                    py: 0.6, 
                    borderRadius: 20, 
                    fontWeight: 700, 
                    background: 'linear-gradient(90deg, #ff6b35, #f7931e)', 
                    boxShadow: '0 6px 18px rgba(255,107,53,0.3)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #e55a2b, #e8841a)',
                      boxShadow: '0 8px 25px rgba(255,107,53,0.4)'
                    }
                  }}>
                  Registro
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Ocultar carrito para administradores; permitir a vendedores usar carrito */}
            {!(token && userRole && Number(userRole) === 3) && (
              <>
                <IconButton 
                  onClick={() => navigate('/carrito')} 
                  aria-label="carrito"
                  sx={{ 
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  <Badge badgeContent={cartCount} color="error">
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>
                {/* Acceso directo a vender: para Rol Vendedor, apunta al carrito */}
                {token && userRole && Number(userRole) === 2 && (
                  <Button
                    onClick={() => navigate('/carrito')}
                    size="small"
                    variant="text"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }
                    }}
                  >
                    Vender
                  </Button>
                )}
                
                {/* Botón de favoritos - solo para usuarios logueados */}
                {token && (
                  <IconButton 
                    onClick={() => navigate('/favoritos')} 
                    aria-label="favoritos"
                    sx={{ 
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <FavoriteIcon sx={{ color: '#ff69b4' }} />
                  </IconButton>
                )}
              </>
            )}

            {token && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ 
                  mx: 1, 
                  color: 'white', 
                  fontWeight: 500,
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>{userNombre || ''} {userApellido || ''}</Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => { clearUserCart(); clearAuth(); navigate('/'); }}
                  sx={{
                    color: '#ffcdd2',
                    borderColor: '#ffcdd2',
                    '&:hover': {
                      backgroundColor: 'rgba(244,67,54,0.12)',
                      borderColor: '#f44336',
                      color: '#f44336'
                    }
                  }}
                >
                  Cerrar sesión
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
