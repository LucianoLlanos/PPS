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
      height: { xs: 300, md: 380 },
      mb: 0,
      mt: 0,
      overflow: 'hidden',
      bgcolor: '#101820',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      maxWidth: 'none',
      boxSizing: 'border-box'
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
            justifyContent: 'center',
            px: { xs: 2, md: 4 },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.45)',
              pointerEvents: 'none',
              zIndex: 1
            },
            '&::after': { display: 'none' }
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
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                  color: '#fff',
                  fontSize: { xs: '1.9rem', md: '3rem' },
                  lineHeight: 1.15,
                  letterSpacing: '-0.5px'
                }}
              >
                {currentBanner.titulo}
              </Typography>
              
              {currentBanner.descripcion && (
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: { xs: '1rem', md: '1.35rem' },
                    fontWeight: 400,
                    letterSpacing: '-0.25px'
                  }}
                >
                  {currentBanner.descripcion}
                </Typography>
              )}

              {currentBanner.enlace && (
                <Button
                  variant="contained"
                  size="medium"
                  sx={{
                    bgcolor: '#ffffff',
                    color: '#0d47a1',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    '&:hover': { bgcolor: '#e3f2fd' },
                    transition: 'all 0.25s ease'
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
              bgcolor: 'rgba(255,255,255,0.8)',
              color: '#0d47a1',
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
              bgcolor: 'rgba(255,255,255,0.8)',
              color: '#0d47a1',
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
          bottom: 12,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          zIndex: 3
        }}>
          {banners.map((_, index) => (
            <Box
              key={index}
              onClick={() => goToSlide(index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'background .25s, transform .25s',
                boxShadow: index === currentIndex ? '0 0 0 4px rgba(255,255,255,0.15)' : 'none',
                '&:hover': { bgcolor: '#fff' }
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}