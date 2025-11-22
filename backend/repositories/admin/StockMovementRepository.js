const { BaseRepository } = require('../BaseRepository');

class StockMovementRepository extends BaseRepository {
  async insertMovement({ idProducto, fromSucursal = null, toSucursal = null, cantidad, tipo = 'ajuste', idUsuario = null, nota = null }, conn) {
    const runner = conn ? conn.query.bind(conn) : this.db.query.bind(this.db);
    await runner('INSERT INTO movimientos_stock (idProducto, fromSucursal, toSucursal, cantidad, tipo, idUsuario, nota, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())', [idProducto, fromSucursal, toSucursal, cantidad, tipo, idUsuario, nota]);
  }

  async listByProduct(idProducto, limit = 50) {
    const sql = 'SELECT idMovimiento, idProducto, fromSucursal, toSucursal, cantidad, tipo, idUsuario, nota, fecha FROM movimientos_stock WHERE idProducto = ? ORDER BY fecha DESC LIMIT ?';
    return this.db.query(sql, [idProducto, Number(limit || 50)]);
  }
}

module.exports = { StockMovementRepository };
