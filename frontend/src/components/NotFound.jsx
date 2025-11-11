import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          textAlign: 'center', 
          py: 6, 
          px: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        {/* Ícono de error */}
        <ErrorOutlineIcon 
          sx={{ 
            fontSize: 120, 
            color: '#ff6b35', 
            mb: 3,
            filter: 'drop-shadow(0 4px 8px rgba(255,107,53,0.3))'
          }} 
        />

        {/* Título principal */}
        <Typography 
          variant="h1" 
          sx={{ 
            fontSize: { xs: '4rem', md: '6rem' },
            fontWeight: 900,
            color: '#2c3e50',
            mb: 2,
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          404
        </Typography>

        {/* Subtítulo */}
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600,
            color: '#34495e',
            mb: 2
          }}
        >
          ¡Oops! Página no encontrada
        </Typography>

        {/* Descripción */}
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            mb: 4,
            maxWidth: 500,
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          La página que estás buscando no existe o ha sido movida. 
          No te preocupes, te ayudamos a encontrar lo que necesitas.
        </Typography>

        {/* Botones de acción */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 999,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 25px rgba(102,126,234,0.4)',
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(102,126,234,0.5)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Ir al Inicio
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 999,
              borderColor: '#667eea',
              color: '#667eea',
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderColor: '#764ba2',
                color: '#764ba2',
                backgroundColor: 'rgba(102,126,234,0.05)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Volver Atrás
          </Button>
        </Box>

        {/* Información adicional */}
        <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <Typography variant="body2" color="text.secondary">
            Si crees que esto es un error, puedes contactarnos o intentar de nuevo más tarde.
          </Typography>
        </Box>
      </Paper>

      {/* Elementos decorativos */}
      <Box sx={{ 
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
        opacity: 0.1,
        zIndex: -1
      }} />
      
      <Box sx={{ 
        position: 'absolute',
        bottom: '20%',
        right: '15%',
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #667eea, #764ba2)',
        opacity: 0.1,
        zIndex: -1
      }} />
    </Container>
  );
}