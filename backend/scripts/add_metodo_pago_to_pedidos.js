const { pool } = require('../db/pool');

async function run() {
  try {
    const [exists] = await pool.query(`SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'metodoPago' LIMIT 1`);
    if (exists && exists.length > 0) {
      console.log('Columna metodoPago ya existe en pedidos. Nada que hacer.');
      return;
    }
    await pool.query(`ALTER TABLE pedidos ADD COLUMN metodoPago VARCHAR(50) NULL AFTER observaciones`);
    console.log('Columna metodoPago agregada a pedidos.');
  } catch (err) {
    console.error('Error agregando metodoPago:', err.message || err);
  } finally {
    pool.end && pool.end();
  }
}

run();
