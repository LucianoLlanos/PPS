import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import '../stylos/ProductImageCarousel.css';

// Props:
// minimal: oculta overlays de nombre, stock y contador numérico (solo dots discretos)
// auto: controla si hace auto-rotación general (por defecto true)
// height: permite ajustar la altura sin duplicar lógica
// intervalMs: velocidad del autoplay en ms
// pauseOnHover: si true (default), pausa al pasar el mouse; si false, no pausa
const ProductImageCarousel = ({ imagenes = [], nombre = 'Producto', stock = null, minimal = true, auto = true, height = 190, intervalMs = 2200, pauseOnHover = true }) => {
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

  // Autoplay global con pausa opcional al hover
  useEffect(() => {
    if (!auto || imageList.length <= 1) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const paused = pauseOnHover && isHovered;
    if (!paused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % imageList.length);
      }, intervalMs);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isHovered, imageList.length, auto, intervalMs, pauseOnHover]);

  const handleImageError = (e) => {
    e.target.src = '/img/descarga.svg';
  };

  const getImageSrc = (img) => {
    if (!img) return '/img/descarga.svg';
    let imagen = typeof img === 'string' ? img : String(img);
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) return imagen;
    if (imagen.startsWith('/')) return imagen; // ruta absoluta ya resuelta
    if (imagen.startsWith('uploads/')) return `http://localhost:3000/${imagen}`;
    return `http://localhost:3000/uploads/${imagen}`;
  };

  // Desactivado el avance manual por click para evitar conflicto con navegación de tarjeta

  return (
    <Box
      onPointerEnter={() => pauseOnHover ? setIsHovered(true) : null}
      onPointerLeave={() => { if (pauseOnHover) setIsHovered(false); }}
      sx={{ position: 'relative', width: '100%', height, overflow: 'hidden', cursor: 'default', display: 'block', borderRadius: minimal ? 0 : 2 }}
    >
        {imageList.length === 0 && (
          <img
            src={'/img/descarga.svg'}
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

      {imageList.length > 1 && (
        <Box className="carousel-indicators" aria-hidden="true">
          {imageList.map((_, index) => (
            <Box key={index} className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`} />
          ))}
        </Box>
      )}
      {/* Overlays desactivados en modo minimal */}
      {!minimal && (
        <>
          <Box className="carousel-name">{nombre}</Box>
          {stock != null && (
            <Box className="carousel-stock">{`Stock: ${stock}`}</Box>
          )}
          {imageList.length > 1 && (
            <Box className="carousel-counter">
              {currentIndex + 1} / {imageList.length}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ProductImageCarousel;