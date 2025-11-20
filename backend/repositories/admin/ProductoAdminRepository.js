const { BaseRepository } = require('../BaseRepository');

class ProductoAdminRepository extends BaseRepository {
  async selectAllWithImages() {
    const hasCategoria = await this.hasColumn('productos', 'categoria');
    const tipoSelect = hasCategoria ? 'p.categoria AS tipo' : "'' AS tipo";
    const sql = `
      SELECT p.idProducto, p.nombre, ${tipoSelect}, p.descripcion, p.precio, p.stockTotal AS stock, p.imagen,
             GROUP_CONCAT(pi.imagen ORDER BY pi.orden) AS imagenes
      FROM productos p
      LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id
      GROUP BY p.idProducto`;
    return this.db.query(sql);
  }

  async selectByIdWithImages(id) {
    const hasCategoria = await this.hasColumn('productos', 'categoria');
    const tipoSelect = hasCategoria ? 'p.categoria AS tipo' : "'' AS tipo";
    const sql = `
      SELECT p.idProducto, p.nombre, ${tipoSelect}, p.descripcion, p.precio, p.stockTotal AS stock, p.imagen,
             GROUP_CONCAT(pi.imagen ORDER BY pi.orden) AS imagenes
      FROM productos p
      LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id
      WHERE p.idProducto = ?
      GROUP BY p.idProducto`;
    const rows = await this.db.query(sql, [id]);
    return rows && rows[0] ? rows[0] : null;
  }

  async insertProduct({ nombre, tipo, descripcion, precio, stockTotal, imagenPrincipal }, conn) {
    const hasCategoria = await this.hasColumn('productos', 'categoria');
    if (hasCategoria) {
      const [result] = await conn.query(
        'INSERT INTO productos (nombre, categoria, descripcion, precio, stockTotal, imagen) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, tipo || null, descripcion, precio, stockTotal, imagenPrincipal]
      );
      return result.insertId;
    }
    const [result] = await conn.query(
      'INSERT INTO productos (nombre, descripcion, precio, stockTotal, imagen) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, precio, stockTotal, imagenPrincipal]
    );
    return result.insertId;
  }

  async insertProductImage(productoId, imagen, orden, conn) {
    await conn.query('INSERT INTO producto_imagenes (producto_id, imagen, orden) VALUES (?, ?, ?)', [productoId, imagen, orden]);
  }

  async updateProductCore(id, { nombre, tipo, descripcion, precio, stockTotal }, conn) {
    const hasCategoria = await this.hasColumn('productos', 'categoria');
    if (hasCategoria) {
      await conn.query('UPDATE productos SET nombre=?, categoria=?, descripcion=?, precio=?, stockTotal=? WHERE idProducto=?', [nombre, tipo || null, descripcion, precio, stockTotal, id]);
      return;
    }
    await conn.query('UPDATE productos SET nombre=?, descripcion=?, precio=?, stockTotal=? WHERE idProducto=?', [nombre, descripcion, precio, stockTotal, id]);
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

module.exports = { ProductoAdminRepository };
