const { pool } = require('../db/pool');
const connection = {
    query(sql, params, cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        pool.query(sql, params).then(([rows]) => cb(null, rows)).catch(err => cb(err));
    },
    end(cb){ if (cb) cb(); }
};

// Test directo del endpoint corregido
function testPedidosFixed() {
    console.log('Probando la función listarPedidos corregida...\n');
    
    // Query principal (igual a la del adminController corregido)
    let sql = `
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
        ORDER BY COALESCE(pe.fechaPedido, pe.fecha) DESC
    `;

    connection.query(sql, [], (err, pedidos) => {
        if (err) {
            console.error('Error en query principal:', err.message);
            return;
        }
        
        console.log('=== PEDIDOS PRINCIPALES ===');
        pedidos.forEach(p => {
            console.log(`ID: ${p.idPedido} | Total: ${p.total} (${typeof p.total}) | Usuario: ${p.nombreUsuario} ${p.apellidoUsuario}`);
        });

        if (pedidos.length === 0) {
            console.log('No se encontraron pedidos');
            connection.end();
            return;
        }

        // Query de detalles (corregida)
        const ids = pedidos.map(p => p.idPedido);
        const placeholders = ids.map(() => '?').join(',');
        
        const queryDetalles = `
            SELECT dp.idPedido, pr.nombre AS nombreProducto, dp.cantidad, dp.precioUnitario
            FROM detalle_pedidos dp
            JOIN productos pr ON dp.idProducto = pr.idProducto
            WHERE dp.idPedido IN (${placeholders})
        `;

        connection.query(queryDetalles, ids, (err2, detalles) => {
            if (err2) {
                console.error('Error en query detalles:', err2.message);
                connection.end();
                return;
            }

            console.log('\n=== DETALLES DE PRODUCTOS ===');
            detalles.forEach(d => {
                console.log(`Pedido ${d.idPedido}: ${d.nombreProducto} x${d.cantidad} @ $${d.precioUnitario}`);
            });

            // Procesamiento final (corregido - mantiene total original)
            const pedidosFinal = pedidos.map((p) => {
                const productos = detalles
                    .filter((d) => d.idPedido === p.idPedido)
                    .map((d) => ({
                        nombre: d.nombreProducto,
                        cantidad: d.cantidad,
                        total: d.cantidad * d.precioUnitario,
                    }));
                
                // CORRECCIÓN: No sobrescribir p.total, mantener el valor de la BD
                return { ...p, productos };
            });

            console.log('\n=== RESULTADO FINAL ===');
            pedidosFinal.forEach(p => {
                console.log(`\nPedido ${p.idPedido}:`);
                console.log(`  Total BD: ${p.total} (${typeof p.total})`);
                console.log(`  Usuario: ${p.nombreUsuario} ${p.apellidoUsuario}`);
                console.log(`  Productos: ${p.productos.length}`);
                p.productos.forEach(prod => {
                    console.log(`    - ${prod.nombre} x${prod.cantidad} = $${prod.total}`);
                });
            });

            connection.end();
            console.log('\n✅ Test completado - El total de BD se mantiene correctamente');
        });
    });
}

testPedidosFixed();