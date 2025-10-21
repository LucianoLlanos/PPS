-- Script para agregar soporte a múltiples imágenes por producto

-- Crear tabla para imágenes de productos
CREATE TABLE IF NOT EXISTS producto_imagenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idProducto INT NOT NULL,
    nombreArchivo VARCHAR(255) NOT NULL,
    orden INT DEFAULT 0,
    fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idProducto) REFERENCES productos(idProducto) ON DELETE CASCADE,
    INDEX idx_producto_orden (idProducto, orden)
);

-- Migrar imágenes existentes de la columna imagen a la nueva tabla
INSERT INTO producto_imagenes (idProducto, nombreArchivo, orden)
SELECT idProducto, imagen, 0
FROM productos 
WHERE imagen IS NOT NULL AND imagen != '';

-- La columna imagen original se puede mantener por compatibilidad
-- o eliminar después de verificar que todo funciona correctamente