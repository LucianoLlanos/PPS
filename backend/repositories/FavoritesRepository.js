const { BaseRepository } = require('./BaseRepository');

class FavoritesRepository extends BaseRepository {
  async listByUsuario(idUsuario) {
    const sql = `
      SELECT 
        f.id as favoriteId,
        p.idProducto,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen,
        p.stockTotal as stock,
        GROUP_CONCAT(pi.imagen ORDER BY pi.orden) AS imagenes
      FROM user_favorites f
      INNER JOIN productos p ON f.idProducto = p.idProducto
      LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id
      WHERE f.idUsuario = ?
      GROUP BY f.id, p.idProducto, p.nombre, p.descripcion, p.precio, p.imagen, p.stockTotal
      ORDER BY f.created_at DESC
    `;
    return this.db.query(sql, [idUsuario]);
  }

  async existsFavorite(idUsuario, idProducto) {
    const rows = await this.db.query('SELECT id FROM user_favorites WHERE idUsuario = ? AND idProducto = ?', [idUsuario, idProducto]);
    return rows.length > 0;
  }

  async addFavorite(idUsuario, idProducto) {
    const sql = 'INSERT INTO user_favorites (idUsuario, idProducto) VALUES (?, ?)';
    const rows = await this.db.query(sql, [idUsuario, idProducto]);
    return rows.insertId;
  }

  async removeFavorite(idUsuario, idProducto) {
    const sql = 'DELETE FROM user_favorites WHERE idUsuario = ? AND idProducto = ?';
    const result = await this.db.query(sql, [idUsuario, idProducto]);
    return result.affectedRows || 0;
  }
}

module.exports = { FavoritesRepository };
