const { pool } = require('../db/pool');
const connection = {
  query(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params).then(([rows]) => cb(null, rows)).catch(err => cb(err));
  },
  end(cb){ if (cb) cb(); }
};

function run() {
  const pedidoId = 64;
  const fechaDesde = '2025-10-01';
  const fechaHasta = '2025-10-31';

  console.log('Comprobando detalle_pedido para idPedido =', pedidoId);
  connection.query('SELECT * FROM detalle_pedidos WHERE idPedido = ?', [pedidoId], (err, rows) => {
    if (err) {
      console.error('Error al consultar detalle_pedidos:', err);
    } else {
      console.log('detalle_pedidos rows:', rows);
    }

    // Ahora summary
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT pe.idPedido) AS pedidos_entregados,
        COALESCE(SUM(dp.cantidad*dp.precioUnitario),0) AS ingresos_totales,
        COALESCE(SUM(dp.cantidad),0) AS unidades_vendidas
      FROM pedidos pe
      JOIN detalle_pedidos dp ON dp.idPedido = pe.idPedido
      WHERE pe.estado = 'entregado' AND DATE(pe.fechaPedido) BETWEEN ? AND ?
    `;

    console.log('\nEjecutando summary query entre', fechaDesde, 'y', fechaHasta);
    connection.query(summaryQuery, [fechaDesde, fechaHasta], (err2, rows2) => {
      if (err2) {
        console.error('Error en summary query:', err2);
      } else {
        console.log('summary result:', rows2);
      }

      const timeseriesQuery = `
        SELECT DATE(pe.fechaPedido) AS fecha, COUNT(DISTINCT pe.idPedido) AS pedidos, COALESCE(SUM(dp.cantidad*dp.precioUnitario),0) AS ingresos
        FROM pedidos pe
        JOIN detalle_pedidos dp ON dp.idPedido = pe.idPedido
        WHERE pe.estado = 'entregado' AND DATE(pe.fechaPedido) BETWEEN ? AND ?
        GROUP BY DATE(pe.fechaPedido)
        ORDER BY DATE(pe.fechaPedido)
      `;

      console.log('\nEjecutando timeseries query entre', fechaDesde, 'y', fechaHasta);
      connection.query(timeseriesQuery, [fechaDesde, fechaHasta], (err3, rows3) => {
        if (err3) {
          console.error('Error en timeseries query:', err3);
        } else {
          console.log('timeseries result:', rows3);
        }

        connection.end();
      });
    });
  });
}

run();
