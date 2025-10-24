const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '12345678',
  database: 'atilio_marola'
});

async function migrarImagenesMultiples() {
  try {
    console.log('🔄 Iniciando migración para soporte de múltiples imágenes...');

    // 1. Crear tabla producto_imagenes
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS producto_imagenes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        producto_id INT NOT NULL,
        imagen VARCHAR(255) NOT NULL,
        orden INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos(idProducto) ON DELETE CASCADE,
        INDEX idx_producto_orden (producto_id, orden)
      )
    `;
    
    await new Promise((resolve, reject) => {
      connection.query(createTableQuery, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    console.log('✅ Tabla producto_imagenes creada');

    // 2. Migrar imágenes existentes de la columna imagen a la nueva tabla
    const productosConImagen = await new Promise((resolve, reject) => {
      connection.query(
        'SELECT idProducto, imagen FROM productos WHERE imagen IS NOT NULL AND imagen != ""', 
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    console.log(`📸 Encontrados ${productosConImagen.length} productos con imágenes existentes`);

    // 3. Insertar imágenes existentes en la nueva tabla
    for (const producto of productosConImagen) {
      await new Promise((resolve, reject) => {
        connection.query(
          'INSERT INTO producto_imagenes (producto_id, imagen, orden) VALUES (?, ?, 0)',
          [producto.idProducto, producto.imagen],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
      console.log(`  ✅ Migrada imagen para producto ${producto.idProducto}: ${producto.imagen}`);
    }

    console.log('🎉 Migración completada exitosamente');
    console.log('💡 Ahora puedes agregar múltiples imágenes por producto');
    
    // Mostrar un ejemplo de consulta
    console.log('\n📋 Ejemplo de consulta para obtener productos con imágenes:');
    console.log(`
      SELECT 
        p.idProducto, p.nombre, p.descripcion, p.precio, p.stockTotal,
        GROUP_CONCAT(pi.imagen ORDER BY pi.orden) as imagenes
      FROM productos p 
      LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id 
      GROUP BY p.idProducto
    `);

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
  }
}

// Ejecutar migración si se ejecuta directamente
if (require.main === module) {
  migrarImagenesMultiples()
    .then(() => {
      console.log('\n🏁 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrarImagenesMultiples };