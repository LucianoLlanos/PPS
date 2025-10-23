import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const ProductImageCarousel = ({ imagenes = [], nombre = 'Producto' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  // Normalizar distintos formatos de `imagenes` que puedan llegar
  const normalize = (imgs) => {
    if (!imgs) return [];
    if (Array.isArray(imgs)) {
      return imgs.map(i => (typeof i === 'string' ? i : (i?.imagen || i?.name || ''))).filter(Boolean);
    }
    if (typeof imgs === 'string') {
      // Intentar parsear JSON
      try {
        const parsed = JSON.parse(imgs);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
          // no es JSON
        }
      if (imgs.includes(',')) return imgs.split(',').map(s => s.trim()).filter(Boolean);
      return [imgs];
    }
    return [];
  };

  const imageList = normalize(imagenes);

  useEffect(() => {
    // limpiar cuando cambian imágenes
    setCurrentIndex(0);
  }, [imagenes]);

  // Auto-avanzar al hacer hover
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!isHovered || imageList.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageList.length);
    }, 900);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isHovered, imageList.length]);

  const handleImageError = (e) => {
    e.target.src = '/img/descarga.jpg';
  };

  const getImageSrc = (imagen) => {
    return imagen ? `http://localhost:3000/uploads/${imagen}` : '/img/descarga.jpg';
  };

  const handleClick = () => {
    if (imageList.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setCurrentIndex(0); }}
      onClick={handleClick}
      sx={{ position: 'relative', width: '100%', height: '100%', minHeight: 220, overflow: 'hidden', cursor: imageList.length > 1 ? 'pointer' : 'default', display: 'block' }}
    >
      {imageList.length === 0 && (
        <img
          src={'/img/descarga.jpg'}
          alt={nombre}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      )}

      {imageList.map((img, idx) => (
        <img
          key={idx}
          src={getImageSrc(img)}
          alt={`${nombre} - Imagen ${idx + 1}`}
          onError={handleImageError}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 450ms ease',
            opacity: idx === currentIndex ? 1 : 0,
          }}
        />
      ))}

      {imageList.length > 1 && (
        <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5, bgcolor: 'rgba(0,0,0,0.45)', px: 0.8, py: 0.25, borderRadius: 2, zIndex: 60 }}>
          {imageList.map((_, index) => (
            <Box key={index} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: index === currentIndex ? '#fff' : 'rgba(255,255,255,0.6)', transition: 'all 0.3s' }} />
          ))}
        </Box>
      )}

      {imageList.length > 1 && isHovered && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', px: 1, py: 0.3, borderRadius: 2, fontSize: 12, fontWeight: 500 }}>
          {currentIndex + 1} / {imageList.length}
        </Box>
      )}
    </Box>
  );
};

export default ProductImageCarousel;