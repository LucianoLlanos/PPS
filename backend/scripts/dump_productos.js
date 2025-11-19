const { pool } = require('../db/pool');
const connection = {
  query(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params).then(([rows]) => cb(null, rows)).catch(err => cb(err));
  },
  end(cb){ if (cb) cb(); }
};

connection.query('SELECT * FROM productos LIMIT 100', (err, results) => {
  if (err) {
    console.error('Error al consultar productos:', err.message || err);
    process.exit(1);
  }
  console.log('Productos encontrados:', (results || []).length);
  if (results && results.length > 0) {
    console.log(JSON.stringify(results.slice(0, 10), null, 2));
  }
  connection.end(() => process.exit(0));
});
