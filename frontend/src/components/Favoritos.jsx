import React, { useEffect } from 'react';
import { Box, Typography, Grid, Alert, CircularProgress, Button, Container } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ProductCardClean from './ProductCardClean';
import useFavoritesStore from '../store/useFavoritesStore';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export default function Favoritos() {
  const { favorites, loading, error, loadFavorites, clearError } = useFavoritesStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Cargar favoritos al montar el componente
  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user, loadFavorites]);

  // Función para ver detalle del producto
  const handleViewProduct = (product) => {
    // Aquí puedes implementar la lógica para mostrar el detalle del producto
    console.log('Ver producto:', product);
  };

  // Función para agregar al carrito
  const handleAddToCart = (product) => {
    // Aquí puedes integrar con el store del carrito
    console.log('Agregar al carrito:', product);
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
        <Grid container spacing={3}>
          {favorites.map((product, index) => (
            <Grid item xs={12} sm={6} md={4} key={product.idProducto || product.id || index}>
              <ProductCardClean
                product={product}
                onView={handleViewProduct}
                onAdd={handleAddToCart}
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