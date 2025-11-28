const { BaseRepository } = require('./BaseRepository');

class OrderRepository extends BaseRepository {
  async insertPedido(conn, { idCliente, fechaPedido, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres, idSucursalOrigen = 1 }) {
    // Nota: la columna `total` en la tabla `pedidos` es obligatoria (sin valor por defecto)
    // Para evitar el error cuando aún no se calculó el total detallado se establece inicialmente en 0.
    const sql = `
      INSERT INTO pedidos (idCliente, estado, fechaPedido, observaciones, idSucursalOrigen, metodoPago, cuotas, interes, descuento, total, totalConInteres)
      VALUES (?, 'Pendiente', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    // Pasamos total = 0 inicialmente; más adelante `updateTotal` escribirá el total real.
    const [result] = await conn.query(sql, [idCliente, fechaPedido, observaciones || null, Number(idSucursalOrigen) || 1, metodoPago || 'Efectivo', cuotas || 1, interes || 0, descuento || 0, 0, totalConInteres || 0]);
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
        p.totalConInteres,
        p.metodoPago,
        p.cuotas,
        p.interes,
        p.descuento,
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
