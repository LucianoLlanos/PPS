const { Database } = require('../core/database');
const { ProductRepository } = require('../repositories/ProductRepository');
const { Product } = require('../domain/Product');

class ProductService {
  constructor(db = new Database(), repo = new ProductRepository(db)) {
    this.db = db;
    this.repo = repo;
  }

  mapImagenes(row) {
    const imagenes = row.imagenes ? String(row.imagenes).split(',') : [];
    return new Product({ ...row, imagenes });
  }

  // idSucursal: optional numeric id of branch to compute availability for
  async listProducts(idSucursal) {
    const rows = await this.repo.findAll();
    const products = rows.map((r) => this.mapImagenes(r));
    // Attach stock per sucursal and global stock by querying stock_sucursal
    try {
      const ids = products.map(p => Number(p.idProducto)).filter(Boolean);
      if (ids.length === 0) return products;
      const placeholders = ids.map(() => '?').join(',');
      const sql = `SELECT idProducto, idSucursal, stockDisponible FROM stock_sucursal WHERE idProducto IN (${placeholders})`;
      const stockRows = await this.db.query(sql, ids);
      const stockMap = {};
      (stockRows || []).forEach(s => {
        const pid = Number(s.idProducto);
        if (!stockMap[pid]) stockMap[pid] = [];
        stockMap[pid].push({ idSucursal: Number(s.idSucursal), stockDisponible: Number(s.stockDisponible || 0) });
      });
      return products.map(p => {
        const stockList = stockMap[Number(p.idProducto)] || [];
        const stockGlobal = stockList.reduce((s, it) => s + Number(it.stockDisponible || 0), 0);
        const availableInThisSucursal = typeof idSucursal !== 'undefined' ? (stockList.some(it => Number(it.idSucursal) === Number(idSucursal) && Number(it.stockDisponible || 0) > 0)) : undefined;
        return { ...p, stockGlobal, stockPorSucursal: stockList, availableInThisSucursal };
      });
    } catch (e) {
      // On any error, return products without per-sucursal breakdown but keep original stock
      return products;
    }
  }

  async getProductById(id, idSucursal) {
    const row = await this.repo.findById(id);
    if (!row) return null;
    const mapped = this.mapImagenes(row);
    try {
      const [rows] = await this.db.query('SELECT idSucursal, stockDisponible FROM stock_sucursal WHERE idProducto=?', [id]);
      const stockList = (rows || []).map(r => ({ idSucursal: Number(r.idSucursal), stockDisponible: Number(r.stockDisponible || 0) }));
      const stockGlobal = stockList.reduce((s, it) => s + Number(it.stockDisponible || 0), 0);
      const availableInThisSucursal = typeof idSucursal !== 'undefined' ? stockList.some(it => Number(it.idSucursal) === Number(idSucursal) && Number(it.stockDisponible || 0) > 0) : undefined;
      return { ...mapped, stockGlobal, stockPorSucursal: stockList, availableInThisSucursal };
    } catch (e) {
      return mapped;
    }
  }
}

module.exports = { ProductService };
