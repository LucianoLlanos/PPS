const { connection } = require('../db/DB');

console.log('🔄 Actualizando totales de pedidos existentes...');

// Actualizar el total de todos los pedidos basándose en sus detalles
const updateTotalsQuery = `
UPDATE pedidos p 
SET total = (
  SELECT COALESCE(SUM(dp.subtotal), 0) 
  FROM detalle_pedidos dp 
  WHERE dp.idPedido = p.idPedido
)
WHERE p.total IS NULL OR p.total = 0
`;

connection.query(updateTotalsQuery, (err, result) => {
  if (err) {
    console.error('❌ Error actualizando totales:', err);
  } else {
    console.log(`✅ Totales actualizados para ${result.affectedRows} pedidos`);
    
    // Verificar algunos pedidos para confirmar
    connection.query(`
      SELECT 
        p.idPedido, 
        p.total, 
        (SELECT SUM(dp.subtotal) FROM detalle_pedidos dp WHERE dp.idPedido = p.idPedido) as calculatedTotal
      FROM pedidos p 
      LIMIT 5
    `, (verifyErr, verifyResults) => {
      if (verifyErr) {
        console.error('❌ Error verificando:', verifyErr);
      } else {
        console.log('✅ Verificación de totales:');
        console.table(verifyResults);
      }
      
      connection.end();
    });
  }
});