const { Database } = require('../../core/database');
const { ProductoAdminRepository } = require('../../repositories/admin/ProductoAdminRepository');
const { StockAdminRepository } = require('../../repositories/admin/StockAdminRepository');
const { SucursalAdminRepository } = require('../../repositories/admin/SucursalAdminRepository');

class ProductsAdminService {
  constructor(db = new Database()) {
    this.db = db;
    this.productRepo = new ProductoAdminRepository(db);
    this.stockRepo = new StockAdminRepository(db);
    this.sucursalRepo = new SucursalAdminRepository(db);
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

  async crearProducto({ nombre, descripcion, precio, stockTotal, imagenes, sucursalesSelected }) {
    return this.db.withTransaction(async (conn) => {
      const imagenPrincipal = imagenes && imagenes.length ? imagenes[0] : null;
      const idProducto = await this.productRepo.insertProduct({ nombre, descripcion, precio, stockTotal, imagenPrincipal }, conn);
      if (imagenes && imagenes.length) {
        for (let i = 0; i < imagenes.length; i++) {
          await this.productRepo.insertProductImage(idProducto, imagenes[i], i, conn);
        }
      }
      const allIds = await this.sucursalRepo.listIds(conn);
      let targets = [];
      if (Array.isArray(sucursalesSelected) && sucursalesSelected.length > 0) {
        const valid = new Set(allIds);
        targets = sucursalesSelected.map(Number).filter(id => valid.has(id));
      } else {
        targets = allIds;
      }
      const total = Number(stockTotal) || 0;
      const n = targets.length || 0;
      const base = n > 0 ? Math.floor(total / n) : 0;
      let remainder = n > 0 ? total % n : 0;
      for (const idSucursal of targets) {
        const asignado = total > 0 ? base + (remainder > 0 ? (remainder--, 1) : 0) : 0;
        await this.stockRepo.insertStockSucursal(idSucursal, idProducto, asignado, conn);
      }
      return idProducto;
    });
  }

  async actualizarProducto(id, { nombre, descripcion, precio, stockTotal, nuevasImagenes, removeImages }) {
    return this.db.withTransaction(async (conn) => {
      await this.productRepo.updateProductCore(id, { nombre, descripcion, precio, stockTotal }, conn);
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