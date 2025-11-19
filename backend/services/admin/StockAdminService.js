const { Database } = require('../../core/database');
const { StockAdminRepository } = require('../../repositories/admin/StockAdminRepository');
const { SucursalAdminRepository } = require('../../repositories/admin/SucursalAdminRepository');

class StockAdminService {
  constructor(db = new Database()) {
    this.db = db;
    this.stockRepo = new StockAdminRepository(db);
    this.sucursalRepo = new SucursalAdminRepository(db);
  }

  async listarStockSucursal() { return this.stockRepo.listStock(); }

  async actualizarStockSucursal(idSucursal, idProducto, stockDisponible) {
    return this.db.withTransaction(async (conn) => {
      const actual = await this.stockRepo.getStockEntry(idSucursal, idProducto, conn);
      if (actual === null) {
        const err = new Error('Registro de stock no encontrado para esa sucursal y producto');
        err.status = 404;
        throw err;
      }
      const nuevoStock = Number(stockDisponible);
      const delta = nuevoStock - Number(actual);
      await this.stockRepo.updateStockEntry(idSucursal, idProducto, nuevoStock, conn);
      if (delta !== 0) {
        await this.stockRepo.incrementProductStockTotal(idProducto, delta, conn);
      }
    });
  }

  async backfillStockSucursales() {
    const productos = await this.db.query('SELECT idProducto FROM productos');
    const sucursales = await this.db.query('SELECT idSucursal FROM sucursales');
    for (const p of productos) {
      for (const s of sucursales) {
        const rows = await this.db.query('SELECT 1 FROM stock_sucursal WHERE idSucursal=? AND idProducto=?', [s.idSucursal, p.idProducto]);
        if (!rows || rows.length === 0) {
          await this.db.query('INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, 0)', [s.idSucursal, p.idProducto]);
        }
      }
    }
  }

  async reconcileStockProducto(idProducto) {
    return this.db.withTransaction(async (conn) => {
      const [prodRows] = await conn.query('SELECT stockTotal FROM productos WHERE idProducto=?', [idProducto]);
      if (!prodRows || prodRows.length === 0) {
        const err = new Error('Producto no encontrado');
        err.status = 404;
        throw err;
      }
      const total = Number(prodRows[0].stockTotal || 0);
      const stocks = await this.stockRepo.listForProducto(idProducto, conn);
      if (stocks.length === 0) {
        const ids = await this.sucursalRepo.listIds(conn);
        const n = ids.length;
        const base = Math.floor(total / n);
        let rem = total % n;
        for (const idSuc of ids) {
          const asign = base + (rem > 0 ? (rem--, 1) : 0);
          await this.stockRepo.insertStockSucursal(idSuc, idProducto, asign, conn);
        }
        return;
      }
      const sum = stocks.reduce((a, b) => a + Number(b.stockDisponible || 0), 0);
      if (sum === total) return;
      let updates = [];
      if (sum === 0) {
        const n = stocks.length;
        const base = Math.floor(total / n);
        let rem = total % n;
        updates = stocks.map(t => ({ idSucursal: t.idSucursal, asign: base + (rem > 0 ? (rem--, 1) : 0) }));
      } else {
        let assignedTotal = 0;
        updates = stocks.map(t => {
          const frac = Number(t.stockDisponible || 0) / sum;
          const asign = Math.floor(frac * total);
          assignedTotal += asign;
          return { idSucursal: t.idSucursal, asign };
        });
        let rem = total - assignedTotal;
        let i = 0;
        while (rem > 0 && updates.length > 0) {
          updates[i % updates.length].asign += 1;
          rem--; i++;
        }
      }
      for (const u of updates) {
        await this.stockRepo.updateStockEntry(u.idSucursal, idProducto, u.asign, conn);
      }
    });
  }
}

module.exports = { StockAdminService };