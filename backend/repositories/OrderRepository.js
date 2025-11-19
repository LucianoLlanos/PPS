const { BaseRepository } = require('./BaseRepository');

class OrderRepository extends BaseRepository {
  async insertPedido(conn, { idCliente, fechaPedido, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres }) {
    const sql = `
      INSERT INTO pedidos (idCliente, estado, fechaPedido, observaciones, idSucursalOrigen, metodoPago, cuotas, interes, descuento, totalConInteres)
      VALUES (?, 'Pendiente', ?, ?, 1, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.query(sql, [idCliente, fechaPedido, observaciones || null, metodoPago || 'Efectivo', cuotas || 1, interes || 0, descuento || 0, totalConInteres || 0]);
    return result.insertId;
  }

  async insertDetalle(conn, { idPedido, idProducto, cantidad, precioUnitario, subtotal }) {
    const sql = `
      INSERT INTO detalle_pedidos (idPedido, idProducto, cantidad, precioUnitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `;
    await conn.query(sql, [idPedido, idProducto, cantidad, precioUnitario, subtotal]);
  }

  async updateTotal(conn, { idPedido, total }) {
    const sql = 'UPDATE pedidos SET total = ? WHERE idPedido = ?';
    await conn.query(sql, [total, idPedido]);
  }

  async getMyOrdersByUsuarioId(idUsuario) {
    const sql = `
      SELECT 
        p.idPedido,
        p.fechaPedido,
        p.estado,
        p.total,
        p.observaciones,
        COUNT(dp.idProducto) as cantidadProductos
      FROM pedidos p
      INNER JOIN clientes c ON p.idCliente = c.idCliente
      LEFT JOIN detalle_pedidos dp ON p.idPedido = dp.idPedido
      WHERE c.idUsuario = ?
      GROUP BY p.idPedido
      ORDER BY p.fechaPedido DESC
    `;
    return this.db.query(sql, [idUsuario]);
  }

  async getOrderDetailsByUsuarioId(idUsuario, idPedido) {
    const sql = `
      SELECT 
        p.idPedido,
        p.fechaPedido,
        p.estado,
        p.total,
        p.observaciones,
        dp.cantidad,
        dp.precioUnitario,
        dp.subtotal,
        prod.nombre as nombreProducto,
        prod.descripcion
      FROM pedidos p
      INNER JOIN clientes c ON p.idCliente = c.idCliente
      LEFT JOIN detalle_pedidos dp ON p.idPedido = dp.idPedido
      LEFT JOIN productos prod ON dp.idProducto = prod.idProducto
      WHERE c.idUsuario = ? AND p.idPedido = ?
      ORDER BY dp.idDetallePedido
    `;
    return this.db.query(sql, [idUsuario, idPedido]);
  }
}

module.exports = { OrderRepository };
