const { BaseRepository } = require('../BaseRepository');

class PedidoAdminRepository extends BaseRepository {
  async selectPedidosWithFilters({ whereSql, params, orderBySql }) {
    // Validar `orderBySql` para evitar inyección en el ORDER BY.
    // Permitimos solo identificadores, puntos, comas y las palabras ASC/DESC.
    let orderClause = 'pe.idPedido DESC';
    if (orderBySql && typeof orderBySql === 'string') {
      const safeOrderRe = /^[\w\.\s,]+(\s+(ASC|DESC))?$/i;
      if (safeOrderRe.test(orderBySql.trim())) {
        orderClause = orderBySql.trim();
      }
    }

    const sql = `
      SELECT pe.idPedido, u.nombre AS nombreUsuario, u.apellido AS apellidoUsuario,
             pe.fechaPedido as fecha, pe.estado,
             COALESCE(pe.total, 0) as total, pe.metodoPago, pe.cuotas, pe.interes, pe.descuento, pe.totalConInteres,
             (SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) as cantidadTotal
      FROM pedidos pe
      JOIN clientes c ON pe.idCliente = c.idCliente
      JOIN usuarios u ON c.idUsuario = u.idUsuario
      ${whereSql || ''}
      ORDER BY ${orderClause}`;
    return this.db.query(sql, params);
  }

  async selectDetallesForPedidos(ids) {
    const placeholders = ids.map(() => '?').join(',');
    const sql = `SELECT dp.idPedido, pr.nombre AS nombreProducto, dp.cantidad, dp.precioUnitario
                 FROM detalle_pedidos dp JOIN productos pr ON dp.idProducto = pr.idProducto
                 WHERE dp.idPedido IN (${placeholders})`;
    return this.db.query(sql, ids);
  }

  async insertPedidoCore({ idCliente, estado, idSucursalOrigen, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres, total }, conn, withPaymentCols) {
    if (withPaymentCols) {
      // Insert initial row including payment columns and use provided total (server-calculated) or 0 as fallback
      const totalValue = (typeof total !== 'undefined' && total !== null) ? total : 0;
      const [res] = await conn.query(
        'INSERT INTO pedidos (idCliente, estado, idSucursalOrigen, fechaPedido, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres, total) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)',
        [idCliente, estado, idSucursalOrigen, observaciones || null, metodoPago || 'Efectivo', cuotas || 1, interes || 0, descuento || 0, totalConInteres || 0, totalValue]
      );
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
    const rows = await this.db.query("SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'metodoPago' LIMIT 1");
    return rows && rows.length > 0;
  }

  async hasCantidadTotalColumn() {
    const rows = await this.db.query("SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'cantidadTotal' LIMIT 1");
    return rows && rows.length > 0;
  }
}

module.exports = { PedidoAdminRepository };
