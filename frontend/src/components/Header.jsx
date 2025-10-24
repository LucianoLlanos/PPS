import React, { useState, useRef, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { getCount, clearUserCart } from '../utils/cart';
import { AppBar, Toolbar, IconButton, Typography, Box, Badge, Button, TextField, InputAdornment, Paper, List, ListItem, ListItemButton, ListItemText, ClickAwayListener } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';

export default function Header({ initialQuery, showSearch = false }) {
  const [q, setQ] = useState(initialQuery || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const timer = useRef(null);
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
    if (!active) return { textTransform: 'none' };
    return {
      textTransform: 'none',
      borderRadius: 1.5,
      backgroundColor: 'rgba(13,110,253,0.06)', // pastel azul suave
      color: 'primary.main',
      fontWeight: 600,
      '&:hover': { backgroundColor: 'rgba(13,110,253,0.08)' }
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
  // fetch suggestions for the search input
  const fetchSuggestions = async (text) => {
    if (!text || text.trim().length === 0) {
      setSuggestions([]);
      setShowSug(false);
      return;
    }
    try {
      const res = await api.get('/productos');
      const items = (res.data || []).map(p => p.nombre || p.name || '');
      const filtered = items.filter(n => n.toLowerCase().includes(text.toLowerCase())).slice(0, 8);
      setSuggestions(filtered);
      setShowSug(true);
    } catch {
      setSuggestions([]);
      setShowSug(false);
    }
  };

  // submit handler for the search form
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
    <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 3 }}>
      <Toolbar sx={{ display: 'flex', gap: 2 }}>
  <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              component={RouterLink}
              to="/"
              variant="h6"
              sx={{
                textDecoration: 'none',
                color: 'text.primary',
                fontWeight: 700,
                '&, &:hover, &:focus, &:active': { textDecoration: 'none' }
              }}
            >
              AtilioMarola
            </Typography>
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
                </>
              )}
              {token && userRole && Number(userRole) !== 3 && (
                <Button component={RouterLink} to="/servicios" variant="outlined" size="small">Servicios</Button>
              )}
            </Box>

            {showSearch && (
              <Box component="form" onSubmit={submit} sx={{ flex: 1, maxWidth: 640, mx: 2, position: 'relative' }}>
                <ClickAwayListener onClickAway={() => setShowSug(false)}>
                  <Box>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Buscar..."
                      value={q}
                      onChange={(e) => handleChange(e.target.value)}
                      onFocus={() => { if (suggestions.length > 0) setShowSug(true); }}
                      InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button type="submit" variant="contained" size="small" sx={{ borderRadius: 8 }}>Ir</Button>
                          </InputAdornment>
                        )
                      }}
                    />

                    {showSug && suggestions && suggestions.length > 0 && (
                      <Paper sx={{ position: 'absolute', zIndex: 20, left: 0, right: 0, mt: 0.5 }}>
                        <List dense>
                          {suggestions.map((s, idx) => (
                            <ListItem key={idx} disablePadding>
                              <ListItemButton onMouseDown={() => pickSuggestion(s)}>
                                <ListItemText primary={s} />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    )}
                  </Box>
                </ClickAwayListener>
              </Box>
            )}

            {/* Centered auth buttons for guests (login/register) */}
            {!token && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 2 }}>
                <Button component={RouterLink} to="/login" variant="outlined" size="small"
                  sx={{ textTransform: 'none', px: 2, py: 0.6, borderRadius: 20, fontWeight: 600, color: '#0b2545', borderColor: 'rgba(11,37,70,0.12)' }}>
                  Login
                </Button>
                <Button component={RouterLink} to="/register" variant="contained" size="small"
                  sx={{ textTransform: 'none', px: 2.2, py: 0.6, borderRadius: 20, fontWeight: 700, background: 'linear-gradient(90deg,#0d6efd,#0b5ed7)', boxShadow: '0 6px 18px rgba(11,37,70,0.08)' }}>
                  Registro
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Hide cart for admin users (role id 3) */}
            {!(token && userRole && Number(userRole) === 3) && (
              <IconButton color="inherit" onClick={() => navigate('/carrito')} aria-label="carrito">
                <Badge badgeContent={cartCount} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            )}

            {token && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ mx: 1 }}>{userNombre || ''} {userApellido || ''}</Typography>
                <Button color="error" variant="outlined" size="small" onClick={() => { clearUserCart(); clearAuth(); navigate('/'); }}>Cerrar sesión</Button>
              </Box>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
