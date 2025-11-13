const { connection } = require('../db/DB');

const queries = [
  `ALTER TABLE pedidos ADD COLUMN cuotas INT DEFAULT 1`,
  `ALTER TABLE pedidos ADD COLUMN interes DECIMAL(5,2) DEFAULT 0.00`,
  `ALTER TABLE pedidos ADD COLUMN descuento DECIMAL(5,2) DEFAULT 0.00`,
  `ALTER TABLE pedidos ADD COLUMN totalConInteres DECIMAL(10,2)`,
  `UPDATE pedidos SET cuotas = 1 WHERE cuotas IS NULL`,
  `UPDATE pedidos SET interes = 0.00 WHERE interes IS NULL`,
  `UPDATE pedidos SET descuento = 0.00 WHERE descuento IS NULL`,
  `UPDATE pedidos SET totalConInteres = total WHERE totalConInteres IS NULL`
];

async function addColumns() {
  for (const query of queries) {
    try {
      await new Promise((resolve, reject) => {
        connection.query(query, (err, result) => {
          if (err) {
            // Si la columna ya existe, ignorar el error
            if (err.code === 'ER_DUP_FIELDNAME') {
              console.log(`✓ Columna ya existe, saltando...`);
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log(`✓ Ejecutado: ${query.substring(0, 50)}...`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error(`✗ Error ejecutando query:`, error.message);
    }
  }
  
  console.log('\n✅ Migración completada');
  connection.end();
}

addColumns();
