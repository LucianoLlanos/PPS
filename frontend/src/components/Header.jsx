import React, { useState, useRef, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { getCount, clearUserCart } from '../utils/cart';
import { AppBar, Toolbar, IconButton, Typography, Box, Badge, Button, TextField, InputAdornment, Paper, List, ListItem, ListItemButton, ListItemText, ClickAwayListener } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';

export default function Header({ initialQuery }) {
  const [q, setQ] = useState(initialQuery || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const timer = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    setCartCount(getCount());
    const handleCartUpdate = (e) => setCartCount(e.detail.count);
    window.addEventListener('cart:updated', handleCartUpdate);
    return () => window.removeEventListener('cart:updated', handleCartUpdate);
  }, []);

  const submit = (e) => {
    if (e) e.preventDefault();
    navigate(`/?q=${encodeURIComponent(q || '')}`);
  };

  const fetchSuggestions = async (text) => {
    if (!text || text.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await api.get('/productos');
      const items = (res.data || []).map(p => p.nombre || p.name || '');
      const filtered = items.filter(n => n.toLowerCase().includes(text.toLowerCase())).slice(0,8);
      setSuggestions(filtered);
      setShowSug(true);
    } catch {
      setSuggestions([]);
      setShowSug(false);
    }
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
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography component={RouterLink} to="/" variant="h6" sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: 700 }}>Atilio Marola</Typography>
        </Box>

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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={() => navigate('/carrito')} aria-label="carrito">
            <Badge badgeContent={cartCount} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>

          {!user && (
            <>
              <Button component={RouterLink} to="/login" variant="outlined" size="small">Login</Button>
              <Button component={RouterLink} to="/register" variant="contained" size="small">Registro</Button>
            </>
          )}

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {Number(user.idRol) === 3 && (
                <>
                  <Button component={RouterLink} to="/productos" variant="text" size="small">Productos</Button>
                  <Button component={RouterLink} to="/usuarios" variant="text" size="small">Usuarios</Button>
                  <Button component={RouterLink} to="/pedidos" variant="text" size="small">Pedidos</Button>
                  <Button component={RouterLink} to="/clientes" variant="text" size="small">Clientes</Button>
                </>
              )}
              <Typography sx={{ mx: 1 }}>{user.nombre} {user.apellido}</Typography>
              <Button color="error" variant="outlined" size="small" onClick={() => { clearUserCart(); clearAuth(); navigate('/'); }}>Cerrar sesión</Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
