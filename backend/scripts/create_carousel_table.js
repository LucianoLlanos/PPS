const mysql = require('mysql2/promise');

async function createCarouselTable() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '12345678',
    database: 'atilio_marola'
  });

  try {
    // Crear tabla para banners del carrusel
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS banners_carousel (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        imagen VARCHAR(255) NOT NULL,
        orden INT DEFAULT 0,
        activo BOOLEAN DEFAULT true,
        enlace VARCHAR(500) DEFAULT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Tabla banners_carousel creada exitosamente');

    // Insertar algunos banners de ejemplo
    const insertSampleData = `
      INSERT INTO banners_carousel (titulo, descripcion, imagen, orden, activo) VALUES 
      ('Bienvenido a AtilioMarola', 'Las mejores herramientas para agua y energía', 'banner1.jpg', 1, true),
      ('Ofertas Especiales', 'Descuentos de hasta 30% en productos seleccionados', 'banner2.jpg', 2, true),
      ('Nuevos Productos', 'Descubre nuestra línea de productos Huargo', 'banner3.jpg', 3, true)
      ON DUPLICATE KEY UPDATE titulo = VALUES(titulo);
    `;

    await connection.execute(insertSampleData);
    console.log('✅ Datos de ejemplo insertados');

  } catch (error) {
    console.error('❌ Error creando tabla:', error);
  } finally {
    await connection.end();
  }
}

createCarouselTable();