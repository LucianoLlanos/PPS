import React, { useState, useRef, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import useFavoritesStore from '../store/useFavoritesStore';
import { getCount, clearUserCart } from '../utils/cart';
import { AppBar, Toolbar, IconButton, Typography, Box, Badge, Button, TextField, InputAdornment, Paper, List, ListItem, ListItemButton, ListItemText, ClickAwayListener } from '@mui/material';
import Popper from '@mui/material/Popper';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MenuIcon from '@mui/icons-material/Menu';

export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const timer = useRef(null);
  const searchAnchorRef = useRef(null);
  const navigate = useNavigate();
  // seleccionar solo primitivos para evitar re-renders por referencia de objeto
  const userRole = useAuthStore((s) => s.user && s.user.idRol);
  const userNombre = useAuthStore((s) => s.user && s.user.nombre);
  const userApellido = useAuthStore((s) => s.user && s.user.apellido);
  const token = useAuthStore((s) => s.token);
  const [pendingServicios, setPendingServicios] = React.useState(0);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const location = useLocation();

  // Devuelve un objeto sx para resaltar ligeramente la sección activa del header
  const activeStyle = (path) => {
    const active = location.pathname === path || location.pathname.startsWith(path + '/');
    if (!active) return { 
      textTransform: 'none',
      color: 'rgba(255,255,255,0.9)',
      '&:hover': { 
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: 'white'
      }
    };
    return {
      textTransform: 'none',
      borderRadius: 1.5,
      backgroundColor: 'rgba(255,255,255,0.15)',
      color: 'white',
      fontWeight: 600,
      '&:hover': { 
        backgroundColor: 'rgba(255,255,255,0.2)',
        color: 'white'
      }
    };
  };

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
        const res = await api.get('/servicios/admin/todas');
        const all = res.data || [];
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
      const res = await api.get('/productos');
      const items = (res.data || []).map(p => p.nombre || p.name || '');
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
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {token && userRole && Number(userRole) === 3 && (
                <>
                  <Button component={RouterLink} to="/ventas-analytics" variant="text" size="small" sx={activeStyle('/ventas-analytics')}>Ventas</Button>
                  <Button component={RouterLink} to="/servicios-admin" variant="text" size="small" startIcon={pendingServicios > 0 ? <Badge badgeContent={pendingServicios} color="error" sx={{ mr: 1 }} /> : null} sx={activeStyle('/servicios-admin')}>
                    Servicios
                  </Button>
                  <Button component={RouterLink} to="/productos" variant="text" size="small" sx={activeStyle('/productos')}>Productos</Button>
                  <Button component={RouterLink} to="/usuarios" variant="text" size="small" sx={activeStyle('/usuarios')}>Usuarios</Button>
                  <Button component={RouterLink} to="/pedidos" variant="text" size="small" sx={activeStyle('/pedidos')}>Pedidos</Button>
                  <Button component={RouterLink} to="/clientes" variant="text" size="small" sx={activeStyle('/clientes')}>Clientes</Button>
                  <Button component={RouterLink} to="/empresa-admin" variant="text" size="small" sx={activeStyle('/empresa-admin')}>Empresa</Button>
                  <Button component={RouterLink} to="/carousel-admin" variant="text" size="small" sx={activeStyle('/carousel-admin')}>Carrusel</Button>
                </>
              )}

              {/* Ya no usamos panel aparte de vendedor; el flujo será desde el carrito */}

              {token && userRole && Number(userRole) !== 3 && Number(userRole) !== 2 && (
                <Button 
                  component={RouterLink} 
                  to="/servicios" 
                  variant="outlined" 
                  size="small"
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Servicios
                </Button>
              )}
            </Box>

            {/* Buscador para usuarios no-admin */}
            {(!token || (userRole && Number(userRole) !== 3)) && (
              <Box component="form" onSubmit={submit} sx={{ flex: 1, maxWidth: 500, mx: 2, position: 'relative' }}>
                <ClickAwayListener onClickAway={() => setShowSug(false)}>
                  <Box ref={searchAnchorRef}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Buscar productos..."
                      value={q}
                      onChange={(e) => handleChange(e.target.value)}
                      onFocus={() => { if (suggestions.length > 0) setShowSug(true); }}
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
                        startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button type="submit" variant="contained" size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>Buscar</Button>
                          </InputAdornment>
                        )
                      }}
                    />

                    <Popper
                      open={Boolean(showSug && suggestions && suggestions.length > 0)}
                      anchorEl={searchAnchorRef.current}
                      placement="bottom-start"
                      modifiers={[{ name: 'offset', options: { offset: [0, 6] } }]}
                      style={{ zIndex: 4000 }}
                    >
                      <Paper sx={{
                        width: searchAnchorRef.current ? searchAnchorRef.current.offsetWidth : undefined,
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.25)'
                      }}>
                        <List dense>
                          {suggestions.map((s, idx) => (
                            <ListItem key={idx} disablePadding>
                              <ListItemButton
                                onMouseDown={() => pickSuggestion(s)}
                                sx={{
                                  '&:hover': {
                                    bgcolor: 'primary.light',
                                    color: 'white'
                                  }
                                }}
                              >
                                <SearchIcon sx={{ mr: 2, color: 'text.secondary', fontSize: '1rem' }} />
                                <ListItemText primary={s} />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Popper>
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
                      backgroundColor: 'rgba(244,67,54,0.1)',
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
