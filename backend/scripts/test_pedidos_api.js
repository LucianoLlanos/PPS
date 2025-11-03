const mysql = require('mysql2/promise');

async function testPedidosQuery() {
    let connection;
    try {
        // Usar la misma configuración que el backend
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '12345678',
            database: 'atilio_marola'
        });

        console.log('Conectado a la base de datos');

        // Ejecutar la misma query que usa listarPedidos en adminController.js
        const query = `
            SELECT 
                pe.idPedido,
                pe.fechaPedido as fecha,
                pe.observaciones,
                COALESCE(pe.total, 0) as total,
                u.nombre as nombreUsuario,
                u.apellido as apellidoUsuario,
                pe.estado,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'idProducto', dp.idProducto,
                        'nombre', p.nombre,
                        'cantidad', dp.cantidad,
                        'precioUnitario', dp.precioUnitario
                    )
                ) as productos,
                COALESCE(pe.cantidadTotal, SUM(dp.cantidad)) as cantidadTotal
            FROM pedidos pe
            LEFT JOIN usuarios u ON pe.idCliente = u.idUsuario
            LEFT JOIN detalle_pedidos dp ON pe.idPedido = dp.idPedido
            LEFT JOIN productos p ON dp.idProducto = p.idProducto
            WHERE pe.idPedido IN (75, 76)
            GROUP BY pe.idPedido, pe.fechaPedido, pe.observaciones, pe.total, u.nombre, u.apellido, pe.estado, pe.cantidadTotal
            ORDER BY pe.fechaPedido DESC
        `;

        const [rows] = await connection.execute(query);
        
        console.log('\n=== RESULTADO DE LA QUERY ===');
        console.log('Número de pedidos:', rows.length);
        
        rows.forEach((pedido, index) => {
            console.log(`\n--- Pedido ${index + 1} ---`);
            console.log('ID:', pedido.idPedido);
            console.log('Total (raw):', pedido.total, '| Tipo:', typeof pedido.total);
            console.log('Total (Number):', Number(pedido.total));
            console.log('Usuario:', pedido.nombreUsuario, pedido.apellidoUsuario);
            console.log('Productos:', JSON.parse(pedido.productos));
            console.log('Cantidad Total:', pedido.cantidadTotal);
            console.log('Estado:', pedido.estado);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testPedidosQuery();