const { BaseRepository } = require('../BaseRepository');

class ProductoAdminRepository extends BaseRepository {
  async selectAllWithImages() {
    const sql = `
      SELECT p.idProducto, p.nombre, COALESCE(c.nombre, '') AS tipo, p.descripcion, p.precio, p.stockTotal AS stock, p.imagen,
             GROUP_CONCAT(pi.imagen ORDER BY pi.orden) AS imagenes, p.idCategoria
      FROM productos p
      LEFT JOIN categorias c ON p.idCategoria = c.idCategoria
      LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id
      GROUP BY p.idProducto`;
    return this.db.query(sql);
  }

  async selectByIdWithImages(id) {
    const sql = `
      SELECT p.idProducto, p.nombre, COALESCE(c.nombre, '') AS tipo, p.descripcion, p.precio, p.stockTotal AS stock, p.imagen,
             GROUP_CONCAT(pi.imagen ORDER BY pi.orden) AS imagenes, p.idCategoria
      FROM productos p
      LEFT JOIN categorias c ON p.idCategoria = c.idCategoria
      LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id
      WHERE p.idProducto = ?
      GROUP BY p.idProducto`;
    const rows = await this.db.query(sql, [id]);
    return rows && rows[0] ? rows[0] : null;
  }

  async insertProduct({ nombre, tipo, descripcion, precio, stockTotal, imagenPrincipal }, conn) {
    // Resolve category name to idCategoria (create if missing)
    let idCategoria = null;
    if (tipo && tipo.toString().trim() !== '') {
      const t = String(tipo).trim();
      const [rows] = await conn.query('SELECT idCategoria FROM categorias WHERE nombre = ? LIMIT 1', [t]);
      if (rows && rows.length) {
        idCategoria = rows[0].idCategoria;
      } else {
        const [res] = await conn.query('INSERT INTO categorias (nombre) VALUES (?)', [t]);
        idCategoria = res.insertId;
      }
    }
    const [result] = await conn.query(
      'INSERT INTO productos (nombre, descripcion, precio, stockTotal, imagen, idCategoria) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, descripcion, precio, stockTotal, imagenPrincipal, idCategoria]
    );
    return result.insertId;
  }

  async insertProductImage(productoId, imagen, orden, conn) {
    await conn.query('INSERT INTO producto_imagenes (producto_id, imagen, orden) VALUES (?, ?, ?)', [productoId, imagen, orden]);
  }

  async updateProductCore(id, { nombre, tipo, descripcion, precio, stockTotal }, conn) {
    // Resolve category name to idCategoria (create if missing)
    let idCategoria = null;
    if (tipo && tipo.toString().trim() !== '') {
      const t = String(tipo).trim();
      const [rows] = await conn.query('SELECT idCategoria FROM categorias WHERE nombre = ? LIMIT 1', [t]);
      if (rows && rows.length) {
        idCategoria = rows[0].idCategoria;
      } else {
        const [res] = await conn.query('INSERT INTO categorias (nombre) VALUES (?)', [t]);
        idCategoria = res.insertId;
      }
    }
    await conn.query('UPDATE productos SET nombre=?, idCategoria=?, descripcion=?, precio=?, stockTotal=? WHERE idProducto=?', [nombre, idCategoria, descriptionOrNull(descripcion), precio, stockTotal, id]);
  }

  async deleteImagesByFilenames(id, filenames, conn) {
    if (!filenames || filenames.length === 0) return;
    for (const filename of filenames) {
      await conn.query('DELETE FROM producto_imagenes WHERE producto_id=? AND imagen=?', [id, filename]);
    }
  }

  async selectFirstImage(id, conn) {
    const [rows] = await conn.query('SELECT imagen FROM producto_imagenes WHERE producto_id=? ORDER BY orden ASC, id ASC LIMIT 1', [id]);
    return rows && rows.length ? rows[0].imagen : null;
  }

  async setMainImage(id, imagen, conn) {
    await conn.query('UPDATE productos SET imagen=? WHERE idProducto=?', [imagen, id]);
  }

  async countOrderItems(id, conn) {
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM detalle_pedidos WHERE idProducto = ?', [id]);
    return rows && rows[0] ? Number(rows[0].count) : 0;
  }

  async deleteStockSucursalByProduct(id, conn) {
    await conn.query('DELETE FROM stock_sucursal WHERE idProducto=?', [id]);
  }

  async deleteImagesByProduct(id, conn) {
    await conn.query('DELETE FROM producto_imagenes WHERE producto_id=?', [id]);
  }

  async deleteProduct(id, conn) {
    await conn.query('DELETE FROM productos WHERE idProducto=?', [id]);
  }

}

function descriptionOrNull(desc) {
  return typeof desc === 'undefined' || desc === null ? null : desc;
}

module.exports = { ProductoAdminRepository };
