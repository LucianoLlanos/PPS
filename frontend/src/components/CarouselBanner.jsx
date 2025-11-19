import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, IconButton, Fade, Button } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { CarouselService } from '../services/CarouselService';

export default function CarouselBanner() {
  const carouselService = useMemo(() => new CarouselService(), []);
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await carouselService.listPublic();
      setBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando banners:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-advance carousel every 5 seconds (pausado en hover)
  useEffect(() => {
    if (banners.length <= 1 || paused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, paused]);

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
    // Evitar texto visible: usar placeholder silencioso, quedará cubierto por el overlay global
    return (
      <Box sx={{ 
        width: '100%', 
        height: 300, 
        bgcolor: '#f5f5f5', 
        mb: 4 
      }} />
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
      height: {
        xs: 'clamp(220px, 36vh, 380px)',
        md: 'clamp(320px, 50vh, 520px)'
      },
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
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
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
            backgroundPosition: { xs: 'center', md: 'center 35%' },
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
              background: 'rgba(0,0,0,0.46)',
              pointerEvents: 'none',
              zIndex: 0
            },
            // Degradado inferior para fundir con el contenido de la página
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: { xs: '32%', md: '40%' },
              background: 'linear-gradient(180deg, rgba(16,24,32,0) 0%, rgba(255,255,255,0.58) 64%, #ffffff 100%)',
              pointerEvents: 'none',
              zIndex: 1
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
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                  color: '#fff',
                  fontSize: { xs: 'clamp(1.6rem, 4.5vw, 2.2rem)', md: 'clamp(2.4rem, 4.2vw, 3.2rem)' },
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
                    fontSize: { xs: 'clamp(0.95rem, 2.6vw, 1.05rem)', md: 'clamp(1.1rem, 1.8vw, 1.3rem)' },
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