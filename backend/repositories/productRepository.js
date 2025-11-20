const { BaseRepository } = require('./BaseRepository');

class ProductRepository extends BaseRepository {
  async findAll() {
    const hasCategoria = await this.hasColumn('productos', 'categoria');
    const tipoSelect = hasCategoria ? 'p.categoria AS tipo' : "'' AS tipo";
    const sql = `
      SELECT
        p.idProducto, p.nombre, ${tipoSelect}, p.descripcion, p.precio, p.stockTotal AS stock, p.imagen,
        GROUP_CONCAT(pi.imagen ORDER BY pi.orden) AS imagenes
      FROM productos p
      LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id
      GROUP BY p.idProducto
    `;
    return this.db.query(sql);
  }

  async findById(id) {
    const hasCategoria = await this.hasColumn('productos', 'categoria');
    const tipoSelect = hasCategoria ? 'p.categoria AS tipo' : "'' AS tipo";
    const sql = `
      SELECT
        p.idProducto, p.nombre, ${tipoSelect}, p.descripcion, p.precio, p.stockTotal AS stock, p.imagen,
        GROUP_CONCAT(pi.imagen ORDER BY pi.orden) AS imagenes
      FROM productos p
      LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id
      WHERE p.idProducto = ?
      GROUP BY p.idProducto
    `;
    const rows = await this.db.query(sql, [id]);
    return rows[0] || null;
  }

  async getBasicById(id, conn = null) {
    const sql = 'SELECT idProducto, nombre, precio FROM productos WHERE idProducto = ?';
    if (conn) {
      const [rows] = await conn.query(sql, [id]);
      return rows[0] || null;
    }
    const rows = await this.db.query(sql, [id]);
    return rows[0] || null;
  }
}

module.exports = { ProductRepository };
