import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import '../stylos/ProductImageCarousel.css';

const ProductImageCarousel = ({ imagenes = [], nombre = 'Producto', stock = null, showNameOnly = false }) => {
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

  // Auto-avanzar al hacer hover / pointer
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
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => { setIsHovered(false); setCurrentIndex(0); }}
      onClick={handleClick}
      sx={{ position: 'relative', width: '100%', height: 220, overflow: 'hidden', cursor: imageList.length > 1 ? 'pointer' : 'default', display: 'block' }}
    >
        {imageList.length === 0 && (
          <img
            src={'/img/descarga.jpg'}
            alt={nombre}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className="carousel-image placeholder"
          />
        )}

        {imageList.map((img, idx) => (
          <img
            key={idx}
            src={getImageSrc(img)}
            alt={`${nombre} - Imagen ${idx + 1}`}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className={`carousel-image ${idx === currentIndex ? 'active' : ''}`}
          />
        ))}

      {imageList.length > 1 && !showNameOnly && (
        <Box className="carousel-indicators" aria-hidden="true">
          {imageList.map((_, index) => (
            <Box key={index} className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`} />
          ))}
        </Box>
      )}

      {imageList.length > 1 && (
        <Box className="carousel-counter">
          {currentIndex + 1} / {imageList.length}
        </Box>
      )}

      {/* Name overlay and optional stock chip */}
      <Box className="carousel-name">{nombre}</Box>
      {stock != null && (
        <Box className="carousel-stock">{`Stock: ${stock}`}</Box>
      )}
    </Box>
  );
};

export default ProductImageCarousel;