const { connection } = require('../db/DB');

// Verificar si existe la columna imagen
connection.query('SHOW COLUMNS FROM productos LIKE "imagen"', (err, results) => {
  if (err) {
    console.error('Error:', err);
    connection.end();
    return;
  }
  
  if (results.length === 0) {
    console.log('Columna imagen no existe, agregándola...');
    connection.query('ALTER TABLE productos ADD COLUMN imagen VARCHAR(255) DEFAULT NULL', (err2) => {
      if (err2) {
        console.error('Error al agregar columna imagen:', err2);
      } else {
        console.log('✅ Columna imagen agregada exitosamente');
      }
      connection.end();
    });
  } else {
    console.log('✅ Columna imagen ya existe');
    connection.end();
  }
});