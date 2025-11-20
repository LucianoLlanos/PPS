const { BaseRepository } = require('../BaseRepository');

class AnalyticsRepository extends BaseRepository {
  async ventasSummary({ start, end, idSucursal }) {
    let sql = `SELECT COUNT(DISTINCT pe.idPedido) AS pedidos_entregados,
                      COALESCE(SUM(dp.cantidad * dp.precioUnitario), 0) AS ingresos_totales,
                      COALESCE(SUM(dp.cantidad), 0) AS unidades_vendidas
               FROM pedidos pe JOIN detalle_pedidos dp ON dp.idPedido = pe.idPedido
               WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ?`;
    const params = [start, end];
    if (idSucursal) { sql += ' AND pe.idSucursalOrigen = ?'; params.push(idSucursal); }
    const rows = await this.db.query(sql, params);
    return rows[0] || { pedidos_entregados:0, ingresos_totales:0, unidades_vendidas:0 };
  }

  async ventasTimeseries({ start, end, idSucursal }) {
    let sql = `SELECT DATE(pe.fecha) AS fecha, COUNT(DISTINCT pe.idPedido) AS pedidos,
                      COALESCE(SUM(dp.cantidad * dp.precioUnitario),0) AS ingresos,
                      COALESCE(SUM(dp.cantidad),0) AS unidades
               FROM pedidos pe JOIN detalle_pedidos dp ON dp.idPedido = pe.idPedido
               WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ?
               GROUP BY DATE(pe.fecha)
               ORDER BY DATE(pe.fecha) ASC`;
    const params = [start, end];
    if (idSucursal) {
      sql = sql.replace('WHERE pe.estado = \'Entregado\' AND DATE(pe.fecha) BETWEEN ? AND ?', "WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ? AND pe.idSucursalOrigen = ?");
      params.push(idSucursal);
    }
    return this.db.query(sql, params);
  }

  async ventasTopProducts({ start, end, limit, idSucursal }) {
    let sql = `SELECT dp.idProducto, pr.nombre AS nombre, SUM(dp.cantidad) AS cantidad,
              SUM(dp.cantidad * dp.precioUnitario) AS ingresos
               FROM detalle_pedidos dp
               JOIN pedidos pe ON dp.idPedido = pe.idPedido
               JOIN productos pr ON dp.idProducto = pr.idProducto
               WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ?
               GROUP BY dp.idProducto
               ORDER BY ingresos DESC
               LIMIT ?`;
    const params = [start, end, limit];
    if (idSucursal) {
      sql = sql.replace('WHERE pe.estado = \'Entregado\' AND DATE(pe.fecha) BETWEEN ? AND ?', "WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ? AND pe.idSucursalOrigen = ?");
      params.splice(2, 0, idSucursal);
    }
    return this.db.query(sql, params);
  }
}

module.exports = { AnalyticsRepository };
