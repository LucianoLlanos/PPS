const { pool } = require('../db/pool');
const connection = pool;

// Verificar si existe la columna imagen
async function run() {
  try {
    const [results] = await connection.query('SHOW COLUMNS FROM productos LIKE "imagen"');
    if (results.length === 0) {
      console.log('Columna imagen no existe, agregándola...');
      await connection.query('ALTER TABLE productos ADD COLUMN imagen VARCHAR(255) DEFAULT NULL');
      console.log('✅ Columna imagen agregada exitosamente');
    } else {
      console.log('✅ Columna imagen ya existe');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end && pool.end();
  }
}

run();