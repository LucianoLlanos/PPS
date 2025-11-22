const { Database } = require('../../core/database');
const { ProductoAdminRepository } = require('../../repositories/admin/ProductoAdminRepository');
const { StockAdminRepository } = require('../../repositories/admin/StockAdminRepository');
const { SucursalAdminRepository } = require('../../repositories/admin/SucursalAdminRepository');
const { StockMovementRepository } = require('../../repositories/admin/StockMovementRepository');

class ProductsAdminService {
  constructor(db = new Database()) {
    this.db = db;
    this.productRepo = new ProductoAdminRepository(db);
    this.stockRepo = new StockAdminRepository(db);
    this.sucursalRepo = new SucursalAdminRepository(db);
    this.movementRepo = new StockMovementRepository(db);
  }

  async listarProductos() {
    const rows = await this.productRepo.selectAllWithImages();
    return rows.map(r => {
      const imgs = r.imagenes ? String(r.imagenes).split(',') : [];
      const finalImgs = (imgs.length > 0) ? imgs : (r.imagen ? [r.imagen] : []);
      return { ...r, imagenes: finalImgs };
    });
  }

  async verProducto(id) {
    const r = await this.productRepo.selectByIdWithImages(id);
    if (!r) return null;
    const imgs = r.imagenes ? String(r.imagenes).split(',') : [];
    const finalImgs = (imgs.length > 0) ? imgs : (r.imagen ? [r.imagen] : []);
    return { ...r, imagenes: finalImgs };
  }

  async crearProducto({ nombre, tipo, descripcion, precio, stockTotal, imagenes, sucursalesSelected }) {
    return this.db.withTransaction(async (conn) => {
      const imagenPrincipal = imagenes && imagenes.length ? imagenes[0] : null;
      const idProducto = await this.productRepo.insertProduct({ nombre, tipo, descripcion, precio, stockTotal, imagenPrincipal }, conn);
      if (imagenes && imagenes.length) {
        for (let i = 0; i < imagenes.length; i++) {
          await this.productRepo.insertProductImage(idProducto, imagenes[i], i, conn);
        }
      }
      // Determine stock allocation per sucursal.
      // New behaviour: accept `stockPorSucursal` (object or array) to set explicit stock per sucursal.
      // Fallback: if not provided, distribute `stockTotal` across selected or all sucursales (legacy behaviour).
      const allIds = await this.sucursalRepo.listIds(conn);
      let targets = [];
      if (Array.isArray(sucursalesSelected) && sucursalesSelected.length > 0) {
        const valid = new Set(allIds);
        targets = sucursalesSelected.map(Number).filter(id => valid.has(id));
      } else {
        targets = allIds;
      }
      // stockPorSucursal may be provided in two forms: { idSucursal: cantidad } or [{ idSucursal, cantidad }, ...]
      const bodyStock = arguments[0] && arguments[0].stockPorSucursal ? arguments[0].stockPorSucursal : undefined;
      let assignedTotal = 0;
      if (bodyStock) {
        // normalize to map
        const map = new Map();
        if (Array.isArray(bodyStock)) {
          for (const it of bodyStock) {
            const idS = Number(it.idSucursal);
            const q = Number(it.cantidad || 0);
            if (!isNaN(idS) && targets.includes(idS)) map.set(idS, q);
          }
        } else if (typeof bodyStock === 'object') {
          for (const k of Object.keys(bodyStock)) {
            const idS = Number(k);
            const q = Number(bodyStock[k] || 0);
            if (!isNaN(idS) && targets.includes(idS)) map.set(idS, q);
          }
        }
        // insert for each target, default 0
        for (const idSucursal of targets) {
          const asign = Number(map.has(idSucursal) ? map.get(idSucursal) : 0);
          assignedTotal += asign;
          await this.stockRepo.insertStockSucursal(idSucursal, idProducto, asign, conn);
        }
        // update product stockTotal to sum
        await conn.query('UPDATE productos SET stockTotal = ? WHERE idProducto = ?', [assignedTotal, idProducto]);
      } else {
        const total = Number(stockTotal) || 0;
        const n = targets.length || 0;
        const base = n > 0 ? Math.floor(total / n) : 0;
        let remainder = n > 0 ? total % n : 0;
        for (const idSucursal of targets) {
          const asignado = total > 0 ? base + (remainder > 0 ? (remainder--, 1) : 0) : 0;
          await this.stockRepo.insertStockSucursal(idSucursal, idProducto, asignado, conn);
        }
        // ensure product stockTotal equals provided total
        await conn.query('UPDATE productos SET stockTotal = ? WHERE idProducto = ?', [total, idProducto]);
      }
      return idProducto;
    });
  }

  async actualizarProducto(id, { nombre, tipo, descripcion, precio, nuevasImagenes, removeImages, stockPorSucursal }) {
    return this.db.withTransaction(async (conn) => {
      // Do not accept direct edits to stockTotal here. Keep current product stockTotal unless stockPorSucursal is provided.
      const [prodRows] = await conn.query('SELECT stockTotal FROM productos WHERE idProducto=? LIMIT 1', [id]);
      const currentTotal = prodRows && prodRows.length ? Number(prodRows[0].stockTotal || 0) : 0;
      await this.productRepo.updateProductCore(id, { nombre, tipo, descripcion, precio, stockTotal: currentTotal }, conn);
      if (Array.isArray(removeImages) && removeImages.length) {
        await this.productRepo.deleteImagesByFilenames(id, removeImages, conn);
        const nuevaPrincipal = await this.productRepo.selectFirstImage(id, conn);
        await this.productRepo.setMainImage(id, nuevaPrincipal, conn);
      }
      if (Array.isArray(nuevasImagenes) && nuevasImagenes.length) {
        const [rows] = await conn.query('SELECT MAX(orden) AS maxOrden FROM producto_imagenes WHERE producto_id=?', [id]);
        let startOrden = rows && rows.length && rows[0].maxOrden != null ? rows[0].maxOrden + 1 : 0;
        for (const img of nuevasImagenes) {
          await this.productRepo.insertProductImage(id, img, startOrden++, conn);
        }
        await this.productRepo.setMainImage(id, nuevasImagenes[0], conn);
      }

      // If client provided stockPorSucursal, apply per-sucursal updates and recalc product total
      if (stockPorSucursal) {
        // normalize stockPorSucursal to a map { idSucursal: cantidad }
        const map = new Map();
        if (Array.isArray(stockPorSucursal)) {
          for (const it of stockPorSucursal) {
            const idS = Number(it.idSucursal);
            const q = Number(it.cantidad || 0);
            if (!isNaN(idS)) map.set(idS, q);
          }
        } else if (typeof stockPorSucursal === 'object') {
          for (const k of Object.keys(stockPorSucursal)) {
            const idS = Number(k);
            const q = Number(stockPorSucursal[k] || 0);
            if (!isNaN(idS)) map.set(idS, q);
          }
        }
        // Apply updates/inserts per sucursal
        for (const [idSucursal, cantidad] of map.entries()) {
          const actual = await this.stockRepo.getStockEntry(idSucursal, id, conn);
          const newQty = Number(cantidad);
          if (actual === null) {
            await this.stockRepo.insertStockSucursal(idSucursal, id, newQty, conn);
            if (newQty !== 0) {
              await this.movementRepo.insertMovement({ idProducto: id, fromSucursal: null, toSucursal: idSucursal, cantidad: newQty, tipo: 'entrada', idUsuario: null, nota: 'Inicialización desde edición de producto' }, conn);
            }
          } else {
            const delta = newQty - Number(actual || 0);
            await this.stockRepo.updateStockEntry(idSucursal, id, newQty, conn);
            if (delta !== 0) {
              await this.movementRepo.insertMovement({ idProducto: id, fromSucursal: null, toSucursal: idSucursal, cantidad: delta, tipo: 'ajuste', idUsuario: null, nota: 'Ajuste desde edición de producto' }, conn);
            }
          }
        }
        // Recalculate product total defensively from stock_sucursal
        await this.stockRepo.recalcProductTotalFromSucursal(id, conn);
      }
    });
  }

  async eliminarProducto(id) {
    return this.db.withTransaction(async (conn) => {
      const count = await this.productRepo.countOrderItems(id, conn);
      if (count > 0) {
        const err = new Error('No se puede eliminar el producto porque tiene pedidos asociados');
        err.status = 400;
        throw err;
      }
      await this.productRepo.deleteStockSucursalByProduct(id, conn);
      await this.productRepo.deleteImagesByProduct(id, conn);
      await this.productRepo.deleteProduct(id, conn);
    });
  }
}

module.exports = { ProductsAdminService };