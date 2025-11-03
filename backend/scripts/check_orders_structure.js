const { connection } = require('../db/DB');

console.log('🔍 Verificando estructura de tablas de pedidos...');

// Verificar tabla pedidos
connection.query('DESCRIBE pedidos', (err, results) => {
  if (err) {
    console.error('❌ Error describiendo tabla pedidos:', err);
  } else {
    console.log('✅ Estructura tabla pedidos:');
    console.table(results);
  }
  
  // Verificar tabla detalle_pedidos
  connection.query('DESCRIBE detalle_pedidos', (err2, results2) => {
    if (err2) {
      console.error('❌ Error describiendo tabla detalle_pedidos:', err2);
    } else {
      console.log('✅ Estructura tabla detalle_pedidos:');
      console.table(results2);
    }
    
    // Verificar tabla clientes
    connection.query('DESCRIBE clientes', (err3, results3) => {
      if (err3) {
        console.error('❌ Error describiendo tabla clientes:', err3);
      } else {
        console.log('✅ Estructura tabla clientes:');
        console.table(results3);
      }
      
      connection.end();
    });
  });
});