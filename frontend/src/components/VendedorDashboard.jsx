import React from 'react';
import { Container, Grid, Card, CardContent, Typography, Box, Button, CardActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Inventory, ShoppingCart, Analytics, ViewCarousel } from '@mui/icons-material';

const VendedorDashboard = () => {
  const navigate = useNavigate();

  const modules = [
    {
      id: 'productos',
      title: 'Productos',
      description: 'Gestionar catálogo de productos, crear y editar artículos',
      icon: <Inventory sx={{ fontSize: 48, color: '#1976d2' }} />,
      path: '/vendedor/productos',
      color: '#e3f2fd'
    },
    {
      id: 'pedidos',
      title: 'Pedidos',
      description: 'Ver y gestionar pedidos de clientes, actualizar estados',
      icon: <ShoppingCart sx={{ fontSize: 48, color: '#388e3c' }} />,
      path: '/vendedor/pedidos',
      color: '#e8f5e8'
    },
    {
      id: 'ventas',
      title: 'Ventas y Analytics',
      description: 'Analizar ventas, estadísticas y reportes de rendimiento',
      icon: <Analytics sx={{ fontSize: 48, color: '#f57c00' }} />,
      path: '/vendedor/ventas',
      color: '#fff3e0'
    },
    {
      id: 'carrusel',
      title: 'Carrusel',
      description: 'Administrar el carrusel de imágenes de la página principal',
      icon: <ViewCarousel sx={{ fontSize: 48, color: '#7b1fa2' }} />,
      path: '/vendedor/carrusel',
      color: '#f3e5f5'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ 
          fontWeight: 'bold', 
          color: '#1976d2',
          mb: 2
        }}>
          Panel de Vendedor
        </Typography>
        <Typography variant="h6" align="center" color="textSecondary" sx={{ mb: 4 }}>
          Gestiona productos, pedidos, ventas y el carrusel desde un solo lugar
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {modules.map((module) => (
          <Grid item xs={12} sm={6} md={6} key={module.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                },
                backgroundColor: module.color,
                border: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 3 }}>
                <Box sx={{ mb: 2 }}>
                  {module.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {module.title}
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ 
                  lineHeight: 1.6,
                  px: 1
                }}>
                  {module.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => navigate(module.path)}
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  Acceder
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Panel de Vendedor - Sistema de Gestión Atilio Marola
        </Typography>
      </Box>
    </Container>
  );
};

export default VendedorDashboard;