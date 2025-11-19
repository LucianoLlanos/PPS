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

  async listProducts() {
    const rows = await this.repo.findAll();
    return rows.map((r) => this.mapImagenes(r));
  }

  async getProductById(id) {
    const row = await this.repo.findById(id);
    if (!row) return null;
    return this.mapImagenes(row);
  }
}

module.exports = { ProductService };
