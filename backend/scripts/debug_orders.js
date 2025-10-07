const { connection } = require('../db/DB');

connection.query('SELECT * FROM orders ORDER BY id DESC', (err, results) => {
  if (err) {
    console.error('Error querying orders:', err);
    connection.end();
    process.exit(1);
  }
  console.log('Orders count:', results.length);
  console.log(results.slice(0, 20));
  connection.end();
});
