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
    // conn.query (connection) resolves to [rows, fields], while this.db.query resolves to rows directly.
    if (conn) {
      const [rows] = await conn.query('SELECT stockDisponible FROM stock_sucursal WHERE idSucursal=? AND idProducto=?', [idSucursal, idProducto]);
      return rows && rows[0] ? Number(rows[0].stockDisponible) : null;
    }
    const rows = await this.db.query('SELECT stockDisponible FROM stock_sucursal WHERE idSucursal=? AND idProducto=?', [idSucursal, idProducto]);
    return rows && rows[0] ? Number(rows[0].stockDisponible) : null;
  }

  async updateStockEntry(idSucursal, idProducto, stockDisponible, conn) {
    await conn.query('UPDATE stock_sucursal SET stockDisponible=? WHERE idSucursal=? AND idProducto=?', [stockDisponible, idSucursal, idProducto]);
  }

  async incrementProductStockTotal(idProducto, delta, conn) {
    // Defensive: ensure delta is a finite number to avoid injecting NaN into SQL
    const d = Number(delta);
    if (!Number.isFinite(d)) {
      throw new Error(`Invalid delta for incrementProductStockTotal: ${delta}`);
    }
    await conn.query('UPDATE productos SET stockTotal = stockTotal + ? WHERE idProducto=?', [d, idProducto]);
  }

  async decrementStockIfAvailable({ idSucursal, idProducto, cantidad }, conn) {
    // Use SELECT FOR UPDATE to avoid race conditions and ensure we target a single row
    const [rows] = await conn.query('SELECT stockDisponible FROM stock_sucursal WHERE idSucursal=? AND idProducto=? FOR UPDATE', [idSucursal, idProducto]);
    if (!rows || rows.length === 0) return false;
    const current = Number(rows[0].stockDisponible || 0);
    if (current < cantidad) return false;
    const nuevo = current - cantidad;
    await conn.query('UPDATE stock_sucursal SET stockDisponible = ? WHERE idSucursal=? AND idProducto=?', [nuevo, idSucursal, idProducto]);
    return true;
  }

  async insertStockSucursal(idSucursal, idProducto, stockDisponible, conn) {
    await conn.query('INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, ?)', [idSucursal, idProducto, stockDisponible]);
  }

  async listForProducto(idProducto, conn) {
    const [rows] = await conn.query('SELECT idSucursal, stockDisponible FROM stock_sucursal WHERE idProducto=?', [idProducto]);
    return rows || [];
  }

  async recalcProductTotalFromSucursal(idProducto, conn) {
    const runner = conn ? conn.query.bind(conn) : this.db.query.bind(this.db);
    const result = await runner('SELECT COALESCE(SUM(stockDisponible),0) AS suma FROM stock_sucursal WHERE idProducto=?', [idProducto]);
    // Handle both mysql2 conn.query ([rows, fields]) and db.query (rows)
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
    const suma = rows && rows[0] ? Number(rows[0].suma || 0) : 0;
    await runner('UPDATE productos SET stockTotal = ? WHERE idProducto = ?', [suma, idProducto]);
    return suma;
  }
}

module.exports = { StockAdminRepository };
