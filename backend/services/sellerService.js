const { Database } = require('../core/database');

class SellerService {
  constructor(db = new Database()) {
    this.db = db;
  }

  // Products (tabla demo `products` + unión con `productos`)
  async createProduct({ name, description, price, stock, image }) {
    const sql = 'INSERT INTO products (name, description, price, stock, image) VALUES (?, ?, ?, ?, ?)';
    const result = await this.db.query(sql, [name, description, price, stock, image || null]);
    return result.insertId;
  }

  async listProducts() {
    const q = `
      SELECT id AS id, name AS name, description AS description, price AS price, stock AS stock, image AS image
      FROM products
      UNION ALL
      SELECT idProducto AS id, nombre AS name, descripcion AS description, precio AS price, stockTotal AS stock, NULL AS image
      FROM productos
      ORDER BY id ASC`;
    return this.db.query(q);
  }

  async getProduct(id) {
    const rowsP = await this.db.query('SELECT id AS id, name AS name, description AS description, price AS price, stock AS stock, image AS image FROM products WHERE id = ?', [id]);
    if (rowsP && rowsP.length) return rowsP[0];
    const rows = await this.db.query('SELECT idProducto AS id, nombre AS name, descripcion AS description, precio AS price, stockTotal AS stock, NULL AS image FROM productos WHERE idProducto = ?', [id]);
    return rows && rows.length ? rows[0] : null;
  }

  async updateProduct({ id, name, description, price, stock, image }) {
    // If image is null, keep existing
    const sql = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image = COALESCE(?, image) WHERE id = ?';
    await this.db.query(sql, [name, description, price, stock, image || null, id]);
    const rows = await this.db.query('SELECT image FROM products WHERE id = ?', [id]);
    const currentImage = rows && rows[0] ? rows[0].image : null;
    return { image: currentImage };
  }

  async deleteProduct(id) {
    const rows = await this.db.query('SELECT image FROM products WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return { notFound: true };
    const image = rows[0].image;
    await this.db.query('DELETE FROM products WHERE id = ?', [id]);
    return { image };
  }

  // Orders (tabla demo orders)
  async createOrder({ customer_name, items, total, status }) {
    const sql = 'INSERT INTO orders (customer_name, items, total, status) VALUES (?, ?, ?, ?)';
    const result = await this.db.query(sql, [customer_name, items, total, status || 'pending']);
    return result.insertId;
  }

  async listOrders() {
    const rows = await this.db.query('SELECT * FROM orders ORDER BY id DESC');
    return rows.map(r => ({ ...r, items: (() => { try { return JSON.parse(r.items || '[]'); } catch { return []; } })() }));
  }

  async updateOrderStatus(id, status) {
    await this.db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  }

  // Carousel (tabla demo carousel)
  async createSlide({ title, caption, link, image }) {
    const res = await this.db.query('INSERT INTO carousel (title, caption, link, image) VALUES (?, ?, ?, ?)', [title, caption, link, image || null]);
    return res.insertId;
  }

  async listSlides() {
    return this.db.query('SELECT * FROM carousel ORDER BY id ASC');
  }

  async deleteSlide(id) {
    const rows = await this.db.query('SELECT image FROM carousel WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return { notFound: true };
    const image = rows[0].image;
    await this.db.query('DELETE FROM carousel WHERE id = ?', [id]);
    return { image };
  }
}

module.exports = { SellerService };
