import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductsService } from '../services/ProductsService';
import {
  Box,
  Container,
  TextField,
  InputAdornment,
  Button,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ClickAwayListener
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function SearchSection({ initialQuery = '' }) {
  const productsService = useMemo(() => new ProductsService(), []);
  const [q, setQ] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const timer = useRef(null);
  const navigate = useNavigate();

  // Fetch suggestions for the search input
  const fetchSuggestions = async (text) => {
    if (!text || text.trim().length === 0) {
      setSuggestions([]);
      setShowSug(false);
      return;
    }
    try {
      const list = await productsService.listPublic();
      const items = (list || []).map(p => p.nombre || p.name || '');
      const filtered = items.filter(n => n.toLowerCase().includes(text.toLowerCase())).slice(0, 8);
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
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box component="form" onSubmit={submit} sx={{ position: 'relative' }}>
        <ClickAwayListener onClickAway={() => setShowSug(false)}>
          <Box>
            <TextField
              fullWidth
              size="large"
              placeholder="¿Qué estás buscando?"
              value={q}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSug(true); }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '1.1rem',
                  '&.Mui-focused': {
                    boxShadow: '0 6px 20px rgba(13,110,253,0.15)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: '2px'
                    }
                  },
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.light'
                    }
                  }
                },
                '& input': {
                  py: 2,
                  '&:focus': {
                    outline: 'none !important',
                    boxShadow: 'none !important'
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.5rem' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button 
                      type="submit" 
                      variant="contained" 
                      size="large"
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        py: 1.2,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem'
                      }}
                    >
                      Buscar
                    </Button>
                  </InputAdornment>
                )
              }}
            />

            {showSug && suggestions && suggestions.length > 0 && (
              <Paper sx={{ 
                position: 'absolute', 
                zIndex: 20, 
                left: 0, 
                right: 0, 
                mt: 1,
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }}>
                <List dense>
                  {suggestions.map((s, idx) => (
                    <ListItem key={idx} disablePadding>
                      <ListItemButton 
                        onMouseDown={() => pickSuggestion(s)}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'primary.light',
                            color: 'white'
                          }
                        }}
                      >
                        <SearchIcon sx={{ mr: 2, color: 'text.secondary' }} />
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
    </Container>
  );
}