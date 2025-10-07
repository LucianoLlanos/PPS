const { connection } = require('../db/DB');
const path = require('path');
const fs = require('fs');

// Helpers
function saveImage(file) {
  if (!file) return null;
  return file.filename; // multer will set filename
}

const sellerController = {
  // Productos
  createProduct: (req, res) => {
    const { name, description, price, stock } = req.body;
    const image = saveImage(req.file);
    const sql = 'INSERT INTO products (name, description, price, stock, image) VALUES (?, ?, ?, ?, ?)';
    connection.query(sql, [name, description, price, stock, image], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: result.insertId, name, description, price, stock, image });
    });
  },

  listProducts: (req, res) => {
    // Leer productos desde ambas tablas posibles y normalizar los campos
    const q = `
      SELECT id AS id, name AS name, description AS description, price AS price, stock AS stock, image AS image
      FROM products
      UNION ALL
      SELECT idProducto AS id, nombre AS name, descripcion AS description, precio AS price, stockTotal AS stock, NULL AS image
      FROM productos
      ORDER BY id ASC`;
    connection.query(q, (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  },

  getProduct: (req, res) => {
    const { id } = req.params;
    // Buscar en products primero, luego en productos
    connection.query('SELECT id AS id, name AS name, description AS description, price AS price, stock AS stock, image AS image FROM products WHERE id = ?', [id], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results && results.length > 0) return res.json(results[0]);
      // intentar en tabla productos (idProducto)
      connection.query('SELECT idProducto AS id, nombre AS name, descripcion AS description, precio AS price, stockTotal AS stock, NULL AS image FROM productos WHERE idProducto = ?', [id], (err2, results2) => {
        if (err2) return res.status(500).json({ error: err2 });
        if (!results2 || results2.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(results2[0]);
      });
    });
  },

  updateProduct: (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock } = req.body;
    const image = saveImage(req.file);

    // If new image uploaded, update image field and delete old file
    connection.query('SELECT image FROM products WHERE id = ?', [id], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (!results.length) return res.status(404).json({ error: 'Producto no encontrado' });
      const oldImage = results[0].image;

      const sql = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image = COALESCE(?, image) WHERE id = ?';
      connection.query(sql, [name, description, price, stock, image, id], (err2) => {
        if (err2) return res.status(500).json({ error: err2 });
        // remove old image file if new one uploaded
        if (image && oldImage) {
          const imgPath = path.join(__dirname, '..', 'uploads', oldImage);
          fs.unlink(imgPath, (unlinkErr) => {
            // ignore unlink errors
          });
        }
        res.json({ id, name, description, price, stock, image: image || oldImage });
      });
    });
  },

  deleteProduct: (req, res) => {
    const { id } = req.params;
    connection.query('SELECT image FROM products WHERE id = ?', [id], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (!results.length) return res.status(404).json({ error: 'Producto no encontrado' });
      const image = results[0].image;
      connection.query('DELETE FROM products WHERE id = ?', [id], (err2) => {
        if (err2) return res.status(500).json({ error: err2 });
        if (image) {
          const imgPath = path.join(__dirname, '..', 'uploads', image);
          fs.unlink(imgPath, () => {});
        }
        res.json({ success: true });
      });
    });
  },

  // Pedidos
  createOrder: (req, res) => {
    const { customer_name, items, total, status } = req.body; // items as JSON string or array
    const sql = 'INSERT INTO orders (customer_name, items, total, status) VALUES (?, ?, ?, ?)';
    const itemsStr = typeof items === 'string' ? items : JSON.stringify(items || []);
    connection.query(sql, [customer_name, itemsStr, total, status || 'pending'], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: result.insertId, customer_name, items: itemsStr, total, status: status || 'pending' });
    });
  },

  listOrders: (req, res) => {
    connection.query('SELECT * FROM orders ORDER BY id DESC', (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results.map(r => ({ ...r, items: JSON.parse(r.items || '[]') })));
    });
  },

  updateOrderStatus: (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, id], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id, status });
    });
  },

  // Carrusel
  createSlide: (req, res) => {
    const { title, caption, link } = req.body;
    const image = saveImage(req.file);
    const sql = 'INSERT INTO carousel (title, caption, link, image) VALUES (?, ?, ?, ?)';
    connection.query(sql, [title, caption, link, image], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: result.insertId, title, caption, link, image });
    });
  },

  listSlides: (req, res) => {
    connection.query('SELECT * FROM carousel ORDER BY id ASC', (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  },

  deleteSlide: (req, res) => {
    const { id } = req.params;
    connection.query('SELECT image FROM carousel WHERE id = ?', [id], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (!results.length) return res.status(404).json({ error: 'Slide no encontrado' });
      const image = results[0].image;
      connection.query('DELETE FROM carousel WHERE id = ?', [id], (err2) => {
        if (err2) return res.status(500).json({ error: err2 });
        if (image) {
          const imgPath = path.join(__dirname, '..', 'uploads', image);
          fs.unlink(imgPath, () => {});
        }
        res.json({ success: true });
      });
    });
  }
};

module.exports = sellerController;
