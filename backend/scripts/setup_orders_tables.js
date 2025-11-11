const { connection } = require('../db/DB');

console.log('🛠️ Creando y ajustando tablas de pedidos...');

// Crear tabla detalle_pedidos si no existe
const createDetalleTable = `
CREATE TABLE IF NOT EXISTS detalle_pedidos (
  idDetallePedido INT AUTO_INCREMENT PRIMARY KEY,
  idPedido INT NOT NULL,
  idProducto INT NOT NULL,
  cantidad INT NOT NULL,
  precioUnitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (idPedido) REFERENCES pedidos(idPedido) ON DELETE CASCADE,
  FOREIGN KEY (idProducto) REFERENCES productos(idProducto) ON DELETE CASCADE
)`;

connection.query(createDetalleTable, (err) => {
  if (err) {
    console.error('❌ Error creando tabla detalle_pedidos:', err);
  } else {
    console.log('✅ Tabla detalle_pedidos creada/verificada');
  }
  
  // Agregar columnas faltantes a la tabla pedidos
  const addColumns = [
    "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS fechaPedido DATETIME DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0",
    "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS observaciones TEXT"
  ];
  
  let completedAlters = 0;
  
  addColumns.forEach((sql, index) => {
    connection.query(sql, (alterErr) => {
      if (alterErr && !alterErr.message.includes('Duplicate column')) {
        console.error(`❌ Error en ALTER ${index + 1}:`, alterErr);
      } else {
        console.log(`✅ Columna ${index + 1} agregada/verificada`);
      }
      
      completedAlters++;
      if (completedAlters === addColumns.length) {
        // Verificar estructura final
        connection.query('DESCRIBE pedidos', (descErr, results) => {
          if (descErr) {
            console.error('❌ Error verificando estructura final:', descErr);
          } else {
            console.log('✅ Estructura final tabla pedidos:');
            console.table(results);
          }
          
          connection.end();
        });
      }
    });
  });
});