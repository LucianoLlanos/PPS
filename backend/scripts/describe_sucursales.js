const { pool } = require('../db/pool');
const connection = {
  query(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params).then(([rows]) => cb(null, rows)).catch(err => cb(err));
  },
  end(cb){ if (cb) cb(); }
};

connection.query('SHOW COLUMNS FROM sucursales', (err, results) => {
  if (err) {
    console.error('Error describiendo sucursales:', err.message || err);
    process.exit(1);
  }
  console.log('Columns in sucursales:\n', results);
  connection.end(() => process.exit(0));
});
