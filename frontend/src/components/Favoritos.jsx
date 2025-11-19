import React, { useEffect } from 'react';
import { Box, Typography, Grid, Alert, CircularProgress, Button, Container } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ProductCardModern from './ProductCardModern';
import useFavoritesStore from '../store/useFavoritesStore';
import useAuthStore from '../store/useAuthStore';
import cart from '../utils/cart';
import { useNavigate } from 'react-router-dom';

export default function Favoritos() {
  const { favorites, loading, error, loadFavorites, clearError, toggleFavorite, isFavorite } = useFavoritesStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Cargar favoritos al montar el componente
  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user, loadFavorites]);

  // Ver detalle
  const handleViewProduct = (product) => {
    navigate(`/productos/${product.idProducto || product.id}`, { state: { product } });
  };

  // Agregar al carrito con validaciones similares a HomeProducts
  const handleAddToCart = (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (Number(user.idRol) === 3) return; // Evitar que admin use carrito
    cart.addToCart(product, 1);
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Iniciar sesión requerido
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Debes iniciar sesión para ver tus productos favoritos
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </Button>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FavoriteIcon sx={{ color: '#ff1744', fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Mis Favoritos
          </Typography>
        </Box>
        <Typography color="text.secondary">
          Aquí encontrarás todos los productos que has marcado como favoritos
        </Typography>
      </Box>

      {/* Error */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {/* Contador */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" color="text.secondary">
          {favorites.length} {favorites.length === 1 ? 'producto favorito' : 'productos favoritos'}
        </Typography>
      </Box>

      {/* Lista de productos favoritos */}
      {favorites.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FavoriteIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No tienes productos favoritos aún
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Explora nuestros productos y marca los que más te gusten con el corazón
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate('/')}
          >
            Explorar Productos
          </Button>
        </Box>
      ) : (
        <Grid container spacing={1.5} sx={{ justifyContent: 'center' }}>
          {favorites.map((product, index) => (
            <Grid item key={product.idProducto || product.id || index} xs={6} sm={4} md={3} lg={3} sx={{ display: 'flex', justifyContent: 'center' }}>
              <ProductCardModern
                product={product}
                onAdd={() => handleAddToCart(product)}
                onView={() => handleViewProduct(product)}
                onToggleFavorite={() => toggleFavorite(product)}
                isFavorite={isFavorite(product.idProducto || product.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Botón para continuar comprando */}
      {favorites.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button 
            variant="outlined" 
            size="large"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate('/')}
          >
            Continuar Comprando
          </Button>
        </Box>
      )}
    </Container>
  );
}