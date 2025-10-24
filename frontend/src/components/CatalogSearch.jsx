import React, { useState, useRef } from 'react';
import { Box, TextField, InputAdornment, Button, Paper, List, ListItem, ListItemButton, ListItemText, ClickAwayListener } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function CatalogSearch({ initialQuery = '' }) {
  const [q, setQ] = useState(initialQuery || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const timer = useRef(null);
  const navigate = useNavigate();

  // keep local q in sync if parent changes initialQuery (e.g., navigation from elsewhere)
  React.useEffect(() => {
    setQ(initialQuery || '');
  }, [initialQuery]);

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

  const submit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setShowSug(false);
    navigate(`/?q=${encodeURIComponent(q || '')}`);
  };

  const handleChange = (val) => {
    setQ(val);
    if (timer.current) clearTimeout(timer.current);
    // debounce suggestions and emit live query event so parent can react without routing
    timer.current = setTimeout(() => {
      fetchSuggestions(val);
      try {
        window.dispatchEvent(new CustomEvent('catalog:query', { detail: { q: val } }));
      } catch { /* ignore */ }
    }, 250);
  };

  const pickSuggestion = (s) => {
    setQ(s);
    setShowSug(false);
    navigate(`/?q=${encodeURIComponent(s)}`);
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ width: '100%', maxWidth: 640, mx: 'auto', position: 'relative' }}>
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
            <Paper sx={{ position: 'absolute', zIndex: 2000, left: 0, right: 0, mt: 0.5, overflow: 'visible' }}>
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
  );
}
