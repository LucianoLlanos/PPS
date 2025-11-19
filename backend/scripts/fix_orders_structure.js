const { pool } = require('../db/pool');
const connection = {
  query(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params).then(([rows]) => cb(null, rows)).catch(err => cb(err));
  },
  end(cb){ if (cb) cb(); }
};

console.log('🛠️ Corrigiendo estructura de tabla pedidos...');

// Función para verificar si una columna existe
const checkColumnExists = (table, column, callback) => {
  const query = `SHOW COLUMNS FROM ${table} LIKE '${column}'`;
  connection.query(query, (err, results) => {
    if (err) {
      callback(err, false);
    } else {
      callback(null, results.length > 0);
    }
  });
};

// Agregar columnas una por una si no existen
const columnsToAdd = [
  {
    name: 'fechaPedido',
    sql: 'ALTER TABLE pedidos ADD COLUMN fechaPedido DATETIME DEFAULT CURRENT_TIMESTAMP'
  },
  {
    name: 'total',
    sql: 'ALTER TABLE pedidos ADD COLUMN total DECIMAL(10,2) DEFAULT 0'
  },
  {
    name: 'observaciones',
    sql: 'ALTER TABLE pedidos ADD COLUMN observaciones TEXT'
  }
];

let processedColumns = 0;

columnsToAdd.forEach(column => {
  checkColumnExists('pedidos', column.name, (err, exists) => {
    if (err) {
      console.error(`❌ Error verificando columna ${column.name}:`, err);
    } else if (exists) {
      console.log(`✅ Columna ${column.name} ya existe`);
    } else {
      // La columna no existe, agregarla
      connection.query(column.sql, (alterErr) => {
        if (alterErr) {
          console.error(`❌ Error agregando columna ${column.name}:`, alterErr);
        } else {
          console.log(`✅ Columna ${column.name} agregada exitosamente`);
        }
      });
    }
    
    processedColumns++;
    if (processedColumns === columnsToAdd.length) {
      // Verificar estructura final
      setTimeout(() => {
        connection.query('DESCRIBE pedidos', (descErr, results) => {
          if (descErr) {
            console.error('❌ Error verificando estructura final:', descErr);
          } else {
            console.log('✅ Estructura final tabla pedidos:');
            console.table(results);
          }
          
          // También verificar detalle_pedidos
          connection.query('DESCRIBE detalle_pedidos', (detErr, detResults) => {
            if (detErr) {
              console.error('❌ Error verificando detalle_pedidos:', detErr);
            } else {
              console.log('✅ Estructura tabla detalle_pedidos:');
              console.table(detResults);
            }
            
            connection.end();
          });
        });
      }, 1000);
    }
  });
});