const { BaseRepository } = require('../BaseRepository');

class PedidoAdminRepository extends BaseRepository {
  async selectPedidosWithFilters({ whereSql, params, orderBySql }) {
    const sql = `
      SELECT pe.idPedido, u.nombre AS nombreUsuario, u.apellido AS apellidoUsuario,
             COALESCE(pe.fechaPedido, pe.fecha) as fecha, pe.estado,
             COALESCE(pe.total, 0) as total, pe.metodoPago, pe.cuotas, pe.interes, pe.descuento, pe.totalConInteres,
             (SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) as cantidadTotal
      FROM pedidos pe
      JOIN clientes c ON pe.idCliente = c.idCliente
      JOIN usuarios u ON c.idUsuario = u.idUsuario
      ${whereSql}
      ORDER BY ${orderBySql}`;
    return this.db.query(sql, params);
  }

  async selectDetallesForPedidos(ids) {
    const placeholders = ids.map(() => '?').join(',');
    const sql = `SELECT dp.idPedido, pr.nombre AS nombreProducto, dp.cantidad, dp.precioUnitario
                 FROM detalle_pedidos dp JOIN productos pr ON dp.idProducto = pr.idProducto
                 WHERE dp.idPedido IN (${placeholders})`;
    return this.db.query(sql, ids);
  }

  async insertPedidoCore({ idCliente, estado, idSucursalOrigen, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres }, conn, withPaymentCols) {
    if (withPaymentCols) {
      const [res] = await conn.query('INSERT INTO pedidos (idCliente, estado, idSucursalOrigen, fechaPedido, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)', [idCliente, estado, idSucursalOrigen, observaciones || null, metodoPago || 'Efectivo', cuotas || 1, interes || 0, descuento || 0, totalConInteres || 0]);
      return res.insertId;
    }
    const [res] = await conn.query('INSERT INTO pedidos (idCliente, estado, idSucursalOrigen, fechaPedido, observaciones) VALUES (?, ?, ?, NOW(), ?)', [idCliente, estado, idSucursalOrigen, observaciones || null]);
    return res.insertId;
  }

  async insertDetalle({ idPedido, idProducto, cantidad, precioUnitario, subtotal }, conn) {
    await conn.query('INSERT INTO detalle_pedidos (idPedido, idProducto, cantidad, precioUnitario, subtotal) VALUES (?, ?, ?, ?, ?)', [idPedido, idProducto, cantidad, precioUnitario, subtotal]);
  }

  async updatePedidoTotals(idPedido, { total, cantidadTotal }, conn, hasCantidadCol) {
    if (hasCantidadCol) {
      await conn.query('UPDATE pedidos SET total=?, cantidadTotal=? WHERE idPedido=?', [total, cantidadTotal, idPedido]);
    } else {
      await conn.query('UPDATE pedidos SET total=? WHERE idPedido=?', [total, idPedido]);
    }
  }

  async getPedidoById(idPedido, conn = null) {
    const runner = conn ? conn.query.bind(conn) : this.db.query.bind(this.db);
    const rows = await runner('SELECT * FROM pedidos WHERE idPedido=?', [idPedido]);
    return rows && rows[0] ? rows[0] : null;
  }

  async getDetallesByPedido(idPedido, conn) {
    const [rows] = await conn.query('SELECT idProducto, cantidad FROM detalle_pedidos WHERE idPedido=?', [idPedido]);
    return rows || [];
  }

  async deleteDetallesByPedido(idPedido, conn) {
    await conn.query('DELETE FROM detalle_pedidos WHERE idPedido=?', [idPedido]);
  }

  async deletePedido(idPedido, conn) {
    await conn.query('DELETE FROM pedidos WHERE idPedido=?', [idPedido]);
  }

  async updateEstado(idPedido, estado) {
    await this.db.query('UPDATE pedidos SET estado=? WHERE idPedido=?', [estado, idPedido]);
  }

  async setFechaEntregaNowIfColumnExists(idPedido) {
    const rows = await this.db.query("SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'fecha_entrega' LIMIT 1");
    if (rows && rows.length > 0) {
      await this.db.query('UPDATE pedidos SET fecha_entrega = NOW() WHERE idPedido = ?', [idPedido]);
    }
  }

  async hasPaymentColumns() {
    const [colMP] = await this.db.query("SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'metodoPago' LIMIT 1");
    return colMP && colMP.length > 0;
  }

  async hasCantidadTotalColumn() {
    const [colCant] = await this.db.query("SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'cantidadTotal' LIMIT 1");
    return colCant && colCant.length > 0;
  }
}

module.exports = { PedidoAdminRepository };
