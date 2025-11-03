const { connection } = require('../db/DB');

console.log('🔍 Investigando pedidos sin total...');

// Verificar pedidos específicos que muestran $0.00
const problemOrders = [75, 76];

problemOrders.forEach(orderId => {
  console.log(`\n--- Verificando pedido ${orderId} ---`);
  
  // Ver datos del pedido
  connection.query(
    'SELECT * FROM pedidos WHERE idPedido = ?', 
    [orderId], 
    (err, pedidoResults) => {
      if (err) {
        console.error(`❌ Error obteniendo pedido ${orderId}:`, err);
        return;
      }
      
      console.log(`📋 Datos del pedido ${orderId}:`);
      console.table(pedidoResults);
      
      // Ver detalles del pedido
      connection.query(
        'SELECT * FROM detalle_pedidos WHERE idPedido = ?', 
        [orderId], 
        (detErr, detalleResults) => {
          if (detErr) {
            console.error(`❌ Error obteniendo detalles del pedido ${orderId}:`, detErr);
            return;
          }
          
          console.log(`📦 Detalles del pedido ${orderId}:`);
          if (detalleResults.length === 0) {
            console.log('⚠️ Este pedido NO TIENE productos en detalle_pedidos');
          } else {
            console.table(detalleResults);
          }
        }
      );
    }
  );
});

// Esperar un poco y cerrar la conexión
setTimeout(() => {
  console.log('\n🔍 Verificando la consulta que usa el admin...');
  
  const adminQuery = `
    SELECT 
      pe.idPedido, 
      u.nombre AS nombreUsuario, 
      u.apellido AS apellidoUsuario, 
      COALESCE(pe.fechaPedido, pe.fecha) as fecha, 
      pe.estado,
      COALESCE(pe.total, 0) as total,
      (SELECT COALESCE(SUM(dp.cantidad), 0) 
       FROM detalle_pedidos dp 
       WHERE dp.idPedido = pe.idPedido) as cantidadTotal
    FROM pedidos pe
    JOIN clientes c ON pe.idCliente = c.idCliente
    JOIN usuarios u ON c.idUsuario = u.idUsuario
    WHERE pe.idPedido IN (75, 76)
    ORDER BY pe.idPedido DESC
  `;
  
  connection.query(adminQuery, (err, results) => {
    if (err) {
      console.error('❌ Error ejecutando consulta admin:', err);
    } else {
      console.log('✅ Resultado de consulta admin:');
      console.table(results);
    }
    
    connection.end();
  });
}, 2000);