const { connection } = require('../db/DB');

connection.query('SHOW COLUMNS FROM sucursales', (err, results) => {
  if (err) {
    console.error('Error describiendo sucursales:', err.message || err);
    process.exit(1);
  }
  console.log('Columns in sucursales:\n', results);
  connection.end(() => process.exit(0));
});
