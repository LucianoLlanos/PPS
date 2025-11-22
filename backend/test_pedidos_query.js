const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '12345678',
    database: 'atilio_marola'
  });
  
  const [rows] = await conn.query(`
    SELECT 
      pe.idPedido, 
      u.nombre AS nombreUsuario, 
      u.apellido AS apellidoUsuario, 
      pe.fechaPedido as fecha, 
      pe.estado,
      COALESCE(pe.total, 0) as total,
      pe.metodoPago,
      pe.cuotas,
      pe.interes,
      pe.descuento,
      pe.totalConInteres
    FROM pedidos pe
    JOIN clientes c ON pe.idCliente = c.idCliente
    JOIN usuarios u ON c.idUsuario = u.idUsuario
    ORDER BY pe.idPedido DESC LIMIT 2
  `);
  
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
})();
