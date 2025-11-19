const { BaseRepository } = require('../BaseRepository');

class StockAdminRepository extends BaseRepository {
  async listStock() {
    const sql = `SELECT ss.idSucursal, ss.idProducto, ss.stockDisponible, p.nombre as nombreProducto, s.nombre as nombreSucursal
                 FROM stock_sucursal ss
                 JOIN productos p ON ss.idProducto = p.idProducto
                 JOIN sucursales s ON ss.idSucursal = s.idSucursal
                 ORDER BY ss.idSucursal, p.idProducto`;
    return this.db.query(sql);
  }

  async getStockEntry(idSucursal, idProducto, conn = null) {
    const runner = conn ? conn.query.bind(conn) : this.db.query.bind(this.db);
    const rows = await runner('SELECT stockDisponible FROM stock_sucursal WHERE idSucursal=? AND idProducto=?', [idSucursal, idProducto]);
    return rows && rows[0] ? Number(rows[0].stockDisponible) : null;
  }

  async updateStockEntry(idSucursal, idProducto, stockDisponible, conn) {
    await conn.query('UPDATE stock_sucursal SET stockDisponible=? WHERE idSucursal=? AND idProducto=?', [stockDisponible, idSucursal, idProducto]);
  }

  async incrementProductStockTotal(idProducto, delta, conn) {
    await conn.query('UPDATE productos SET stockTotal = stockTotal + ? WHERE idProducto=?', [delta, idProducto]);
  }

  async decrementStockIfAvailable({ idSucursal, idProducto, cantidad }, conn) {
    const [updRes] = await conn.query('UPDATE stock_sucursal SET stockDisponible = stockDisponible - ? WHERE idProducto=? AND idSucursal=? AND stockDisponible >= ?', [cantidad, idProducto, idSucursal, cantidad]);
    return updRes && updRes.affectedRows > 0;
  }

  async insertStockSucursal(idSucursal, idProducto, stockDisponible, conn) {
    await conn.query('INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, ?)', [idSucursal, idProducto, stockDisponible]);
  }

  async listForProducto(idProducto, conn) {
    const [rows] = await conn.query('SELECT idSucursal, stockDisponible FROM stock_sucursal WHERE idProducto=?', [idProducto]);
    return rows || [];
  }
}

module.exports = { StockAdminRepository };
