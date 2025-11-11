import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Fade, Button } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import api from '../api/axios';

export default function CarouselBanner() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await api.get('/carousel/public');
      setBanners(response.data || []);
    } catch (error) {
      console.error('Error cargando banners:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleBannerClick = (enlace) => {
    if (enlace) {
      if (enlace.startsWith('http')) {
        window.open(enlace, '_blank');
      } else {
        window.location.href = enlace;
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        width: '100%', 
        height: 300, 
        bgcolor: '#f5f5f5', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        mb: 4 
      }}>
        <Typography color="text.secondary">Cargando...</Typography>
      </Box>
    );
  }

  if (banners.length === 0) {
    return null; // No mostrar nada si no hay banners
  }

  const currentBanner = banners[currentIndex];

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100vw', 
      height: { xs: 340, md: 420 }, 
      mb: 0,
      mt: 0, // Sin margen superior
      overflow: 'hidden',
      bgcolor: '#f5f5f5',
      // Técnica para forzar el ancho completo desde cualquier contenedor
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      maxWidth: 'none',
      boxSizing: 'border-box',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '30%',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(248,249,250,0.3) 50%, rgba(248,249,250,0.8) 100%)',
        pointerEvents: 'none',
        zIndex: 10
      }
    }}>
      {/* Banner principal */}
      <Fade in={true} timeout={500} key={currentIndex}>
        <Box
          onClick={() => handleBannerClick(currentBanner.enlace)}
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: currentBanner.imagen ? 
              `url(${process.env.NODE_ENV === 'production' 
                ? `/uploads/${currentBanner.imagen}` 
                : `http://localhost:3000/uploads/${currentBanner.imagen}`})` :
              'linear-gradient(135deg, #FFE600 0%, #FF6B35 25%, #4ECDC4 50%, #45B7D1 75%, #96CEB4 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            cursor: currentBanner.enlace ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 3, md: 6 },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: currentBanner.imagen ? 
                'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0.6) 100%)' :
                `linear-gradient(to bottom, 
                  rgba(255,230,0,0.9) 0%, 
                  rgba(255,107,53,0.8) 20%, 
                  rgba(78,205,196,0.7) 40%, 
                  rgba(69,183,209,0.5) 60%, 
                  rgba(150,206,180,0.3) 80%, 
                  rgba(150,206,180,0.1) 90%,
                  transparent 100%
                )`,
              pointerEvents: 'none',
              zIndex: 1
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.2) 60%, rgba(255,255,255,0.3) 100%)',
              pointerEvents: 'none',
              zIndex: 2
            }
          }}
        >
          {/* Contenido del banner - Estilo MercadoLibre */}
          <Box sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 1200,
            mx: 'auto'
          }}>
            {/* Texto principal */}
            <Box sx={{
              textAlign: 'center',
              color: 'white',
              px: { xs: 2, md: 4 }
            }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 800, 
                  mb: 2,
                  textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  lineHeight: 1.1,
                  background: 'linear-gradient(45deg, #FFFFFF 0%, #F0F8FF 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                {currentBanner.titulo}
              </Typography>
              
              {currentBanner.descripcion && (
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
                    fontSize: { xs: '1.2rem', md: '1.8rem' },
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.95)'
                  }}
                >
                  {currentBanner.descripcion}
                </Typography>
              )}

              {currentBanner.enlace && (
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: '#FFFFFF',
                    color: '#0066CC',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    px: 5,
                    py: 2,
                    borderRadius: 3,
                    textTransform: 'none',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                    '&:hover': {
                      bgcolor: '#F0F8FF',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Ver ofertas
                </Button>
              )}
            </Box>


          </Box>
        </Box>
      </Fade>

      {/* Botones de navegación */}
      {banners.length > 1 && (
        <>
          <IconButton
            onClick={goToPrevious}
            sx={{
              position: 'absolute',
              left: { xs: 8, md: 16 },
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.95)',
              color: '#0066CC',
              zIndex: 3,
              width: { xs: 44, md: 52 },
              height: { xs: 44, md: 52 },
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                bgcolor: '#FFFFFF',
                transform: 'translateY(-50%) scale(1.05)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronLeft sx={{ fontSize: { xs: 22, md: 28 } }} />
          </IconButton>

          <IconButton
            onClick={goToNext}
            sx={{
              position: 'absolute',
              right: { xs: 8, md: 16 },
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.95)',
              color: '#0066CC',
              zIndex: 3,
              width: { xs: 44, md: 52 },
              height: { xs: 44, md: 52 },
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                bgcolor: '#FFFFFF',
                transform: 'translateY(-50%) scale(1.05)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronRight sx={{ fontSize: { xs: 22, md: 28 } }} />
          </IconButton>
        </>
      )}

      {/* Indicadores de páginas */}
      {banners.length > 1 && (
        <Box sx={{
          position: 'absolute',
          bottom: { xs: 16, md: 20 },
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: { xs: 0.8, md: 1 },
          zIndex: 3,
          bgcolor: 'rgba(255,255,255,0.9)',
          borderRadius: 15,
          px: 2,
          py: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {banners.map((_, index) => (
            <Box
              key={index}
              onClick={() => goToSlide(index)}
              sx={{
                width: { xs: 10, md: 12 },
                height: { xs: 10, md: 12 },
                borderRadius: '50%',
                bgcolor: index === currentIndex ? '#0066CC' : 'rgba(0,102,204,0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#0066CC',
                  transform: 'scale(1.3)'
                }
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}