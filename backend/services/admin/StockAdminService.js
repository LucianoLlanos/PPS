const { Database } = require('../../core/database');
const { StockAdminRepository } = require('../../repositories/admin/StockAdminRepository');
const { SucursalAdminRepository } = require('../../repositories/admin/SucursalAdminRepository');
const { StockMovementRepository } = require('../../repositories/admin/StockMovementRepository');

class StockAdminService {
  constructor(db = new Database()) {
    this.db = db;
    this.stockRepo = new StockAdminRepository(db);
    this.sucursalRepo = new SucursalAdminRepository(db);
    this.movementRepo = new StockMovementRepository(db);
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
      const actualNum = Number(actual);
      const delta = nuevoStock - actualNum;
      // Log values to help debug numeric issues
      try { console.debug('[StockAdminService] actualizarStockSucursal values:', { idSucursal, idProducto, stockDisponible, nuevoStock, actual, actualNum, delta }); } catch (e) {}
      if (!Number.isFinite(nuevoStock) || !Number.isFinite(actualNum) || !Number.isFinite(delta)) {
        const err = new Error('Error numérico al calcular delta de stock (valores inválidos)');
        err.status = 400;
        throw err;
      }
      await this.stockRepo.updateStockEntry(idSucursal, idProducto, nuevoStock, conn);
      // Recalcular el stock total del producto desde todas las sucursales
      await this.stockRepo.recalcProductTotalFromSucursal(idProducto, conn);
      // Registrar movimiento si hubo variación
      if (delta !== 0) {
        try {
          await this.movementRepo.insertMovement({ idProducto, fromSucursal: null, toSucursal: idSucursal, cantidad: delta, tipo: 'ajuste', idUsuario: null, nota: 'Ajuste manual desde admin' }, conn);
        } catch (e) {}
      }
    });
  }

  // Transfer stock between sucursales (does not change product.stockTotal)
  async transferStock({ idProducto, fromSucursal, toSucursal, cantidad, idUsuario = null, nota = null }) {
    if (!idProducto || !fromSucursal || !toSucursal || !cantidad || cantidad <= 0) {
      const err = new Error('Parámetros inválidos para transferencia'); err.status = 400; throw err;
    }
    return this.db.withTransaction(async (conn) => {
      // decrement source
      const ok = await this.stockRepo.decrementStockIfAvailable({ idSucursal: fromSucursal, idProducto, cantidad }, conn);
      if (!ok) {
        const err = new Error(`Stock insuficiente en sucursal ${fromSucursal}`); err.status = 400; throw err;
      }
      // ensure destination entry exists
      const destActual = await this.stockRepo.getStockEntry(toSucursal, idProducto, conn);
      if (destActual === null) {
        await this.stockRepo.insertStockSucursal(toSucursal, idProducto, cantidad, conn);
      } else {
        const nuevo = Number(destActual || 0) + Number(cantidad);
        await this.stockRepo.updateStockEntry(toSucursal, idProducto, nuevo, conn);
      }
      // record movement (transfer)
      await this.movementRepo.insertMovement({ idProducto, fromSucursal, toSucursal, cantidad, tipo: 'transfer', idUsuario, nota }, conn);
      // Recalcular total por seguridad (debería permanecer constante, pero asegura consistencia)
      await this.stockRepo.recalcProductTotalFromSucursal(idProducto, conn);
    });
  }

  // Adjust stock absolute value for a sucursal (admin correction). delta applied to product stockTotal.
  async adjustStock({ idProducto, idSucursal, nuevoStock, idUsuario = null, nota = null }) {
    if (!idProducto || !idSucursal || typeof nuevoStock === 'undefined' || isNaN(Number(nuevoStock))) {
      const err = new Error('Parámetros inválidos para ajuste'); err.status = 400; throw err;
    }
    return this.db.withTransaction(async (conn) => {
      const actual = await this.stockRepo.getStockEntry(idSucursal, idProducto, conn);
      if (actual === null) {
        // create entry
        await this.stockRepo.insertStockSucursal(idSucursal, idProducto, Number(nuevoStock), conn);
        const delta = Number(nuevoStock);
        await this.stockRepo.incrementProductStockTotal(idProducto, delta, conn);
        await this.movementRepo.insertMovement({ idProducto, fromSucursal: null, toSucursal: idSucursal, cantidad: delta, tipo: 'ajuste', idUsuario, nota }, conn);
        return;
      }
      const delta = Number(nuevoStock) - Number(actual);
      await this.stockRepo.updateStockEntry(idSucursal, idProducto, Number(nuevoStock), conn);
      if (delta !== 0) {
        await this.stockRepo.incrementProductStockTotal(idProducto, delta, conn);
        await this.movementRepo.insertMovement({ idProducto, fromSucursal: null, toSucursal: idSucursal, cantidad: delta, tipo: 'ajuste', idUsuario, nota }, conn);
      }
      // Recalcular total desde sucursales para asegurar consistencia
      await this.stockRepo.recalcProductTotalFromSucursal(idProducto, conn);
    });
  }

  async listMovementsForProduct(idProducto, limit = 100) {
    return this.movementRepo.listByProduct(idProducto, limit);
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

  async reconcileAllProducts() {
    return this.db.withTransaction(async (conn) => {
      const [rows] = await conn.query('SELECT idProducto FROM productos');
      for (const r of (rows || [])) {
        await this.stockRepo.recalcProductTotalFromSucursal(r.idProducto, conn);
      }
    });
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