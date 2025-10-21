import React, { useState } from 'react';

const ProductImageCarousel = ({ imagenes = [], nombre = 'Producto' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Si no hay imágenes, mostrar imagen por defecto
  const imageList = imagenes.length > 0 ? imagenes : [null];

  // Auto-avanzar al hacer hover
  React.useEffect(() => {
    if (!isHovered || imageList.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageList.length);
    }, 800); // Cambiar cada 800ms

    return () => clearInterval(interval);
  }, [isHovered, imageList.length]);

  const handleImageError = (e) => {
    e.target.src = '/img/descarga.jpg';
  };

  const getImageSrc = (imagen) => {
    return imagen ? `http://localhost:3000/uploads/${imagen}` : '/img/descarga.jpg';
  };

  return (
    <div 
      className="product-image-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentIndex(0); // Volver a la primera imagen al salir
      }}
      style={{ 
        position: 'relative',
        overflow: 'hidden',
        cursor: imageList.length > 1 ? 'pointer' : 'default'
      }}
    >
      <img 
        src={getImageSrc(imageList[currentIndex])} 
        alt={`${nombre} - Imagen ${currentIndex + 1}`} 
        className="product-image"
        onError={handleImageError}
        style={{
          transition: 'opacity 0.3s ease-in-out',
          opacity: 1
        }}
      />
      
      {/* Indicadores de múltiples imágenes */}
      {imageList.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '4px',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '4px 8px',
          borderRadius: '12px',
          transition: 'opacity 0.3s ease',
          opacity: isHovered ? 1 : 0.7
        }}>
          {imageList.map((_, index) => (
            <div
              key={index}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: index === currentIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      )}

      {/* Contador de imágenes */}
      {imageList.length > 1 && isHovered && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {currentIndex + 1} / {imageList.length}
        </div>
      )}
    </div>
  );
};

export default ProductImageCarousel;