const { BaseRepository } = require('../BaseRepository');

class HistorialRepository extends BaseRepository {
  async insert(tabla, idRegistro, accion, usuario, descripcion, conn = null) {
    // Usar la tabla `historial` (esquema canonical)
    const sql = 'INSERT INTO historial (tabla, idRegistro, accion, usuario, descripcion) VALUES (?, ?, ?, ?, ?)';
    if (conn) {
      await conn.query(sql, [tabla, idRegistro, accion, usuario, descripcion]);
      return;
    }
    await this.db.query(sql, [tabla, idRegistro, accion, usuario, descripcion]);
  }
}

module.exports = { HistorialRepository };
