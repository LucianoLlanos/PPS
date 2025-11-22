const { Database } = require('../core/database');

class SellerService {
  constructor(db = new Database()) {
    this.db = db;
    const { NotificationService } = require('./NotificationService');
    this.notif = new NotificationService(db);
  }

  // Products (tabla demo `products` + unión con `productos`)
  async createProduct({ name, description, price, stock, image, tipo }) {
    // Resolve or create category
    let idCategoria = null;
    if (tipo && String(tipo).trim() !== '') {
      const t = String(tipo).trim();
      const rows = await this.db.query('SELECT idCategoria FROM categorias WHERE nombre = ? LIMIT 1', [t]);
      if (rows && rows.length) idCategoria = rows[0].idCategoria;
      else {
        const res = await this.db.query('INSERT INTO categorias (nombre) VALUES (?)', [t]);
        idCategoria = res.insertId;
      }
    }
    const sql = 'INSERT INTO productos (nombre, descripcion, precio, stockTotal, imagen, idCategoria) VALUES (?, ?, ?, ?, ?, ?)';
    const result = await this.db.query(sql, [name, description, price, stock || 0, image || null, idCategoria]);
    return result.insertId;
  }

  async listProducts() {
    const q = `
      SELECT p.idProducto AS id, p.nombre AS name, p.descripcion AS description, p.precio AS price, p.stockTotal AS stock, p.imagen AS image,
             COALESCE(c.nombre, '') AS tipo
      FROM productos p
      LEFT JOIN categorias c ON p.idCategoria = c.idCategoria
      ORDER BY p.idProducto ASC`;
    return this.db.query(q, []);
  }

  async getProduct(id) {
    const sql = `SELECT p.idProducto AS id, p.nombre AS name, p.descripcion AS description, p.precio AS price, p.stockTotal AS stock, p.imagen AS image, COALESCE(c.nombre,'') AS tipo
      FROM productos p LEFT JOIN categorias c ON p.idCategoria = c.idCategoria WHERE p.idProducto = ?`;
    const rows = await this.db.query(sql, [id]);
    return rows && rows.length ? rows[0] : null;
  }

  async updateProduct({ id, name, description, price, stock, image, tipo }) {
    // If image is null, keep existing
    // Resolve category
    let idCategoria = null;
    if (tipo && String(tipo).trim() !== '') {
      const t = String(tipo).trim();
      const rows = await this.db.query('SELECT idCategoria FROM categorias WHERE nombre = ? LIMIT 1', [t]);
      if (rows && rows.length) idCategoria = rows[0].idCategoria;
      else {
        const res = await this.db.query('INSERT INTO categorias (nombre) VALUES (?)', [t]);
        idCategoria = res.insertId;
      }
    }
    const sql = 'UPDATE productos SET nombre = ?, idCategoria = ?, descripcion = ?, precio = ?, stockTotal = ?, imagen = COALESCE(?, imagen) WHERE idProducto = ?';
    await this.db.query(sql, [name, idCategoria, description, price, stock, image || null, id]);
    const rows = await this.db.query('SELECT imagen FROM productos WHERE idProducto = ?', [id]);
    const currentImage = rows && rows[0] ? rows[0].imagen : null;
    return { image: currentImage };
  }

  async deleteProduct(id) {
    const rows = await this.db.query('SELECT imagen FROM productos WHERE idProducto = ?', [id]);
    if (!rows || rows.length === 0) return { notFound: true };
    const image = rows[0].imagen;
    await this.db.query('DELETE FROM productos WHERE idProducto = ?', [id]);
    return { image };
  }

  // Orders (tabla demo orders)
  async createOrder({ customer_name, items, total, status }) {
    // Legacy method — create a minimal pedido record in `pedidos` with placeholder cliente=1
    // Use `idSucursalOrigen` to align with the normalized schema and reference clientes.idCliente
    const sql = 'INSERT INTO pedidos (idCliente, idSucursalOrigen, total, estado, metodoPago, direccionEnvio, fechaPedido) VALUES (?, ?, ?, ?, ?, ?, NOW())';
    const result = await this.db.query(sql, [1, 1, total || 0, (status || 'pendiente'), null, null]);
    const idPedido = result.insertId;
    // Crear notificación para admin
    try {
      const mensaje = `Nuevo pedido (legacy) #${idPedido} - ${customer_name || 'venta'} - total $${total || 0}`;
      await this.notif.createNotification({ tipo: 'pedido', referenciaId: idPedido, mensaje, destinatarioRol: 'Administrador', metadata: { total } });
    } catch (e) {
      console.warn('[Notification] No se pudo crear notificación para createOrder:', e && e.message ? e.message : e);
    }
    return idPedido;
  }

  async listOrders() {
    // List pedidos from normalized table
    const rows = await this.db.query('SELECT idPedido AS id, idCliente, idSucursal, total, estado, metodoPago, fechaPedido AS created_at FROM pedidos ORDER BY idPedido DESC', []);
    return rows;
  }

  async updateOrderStatus(id, status) {
    await this.db.query('UPDATE pedidos SET estado = ? WHERE idPedido = ?', [status, id]);
  }

  // Carousel (tabla demo carousel)
  async createSlide({ title, caption, link, image }) {
    const res = await this.db.query('INSERT INTO banners_carousel (titulo, descripcion, imagen, enlace) VALUES (?, ?, ?, ?)', [title, caption, image || null, link || null]);
    return res.insertId;
  }

  async listSlides() {
    return this.db.query('SELECT id, titulo AS title, descripcion AS caption, enlace AS link, imagen AS image, orden, activo FROM banners_carousel ORDER BY orden ASC, fecha_creacion DESC', []);
  }

  async deleteSlide(id) {
    const rows = await this.db.query('SELECT imagen FROM banners_carousel WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return { notFound: true };
    const image = rows[0].imagen;
    await this.db.query('DELETE FROM banners_carousel WHERE id = ?', [id]);
    return { image };
  }
}

module.exports = { SellerService };
