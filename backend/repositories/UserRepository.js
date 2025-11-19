const { BaseRepository } = require('./BaseRepository');

class UserRepository extends BaseRepository {
  async findByEmail(email, conn = null) {
    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    if (conn) {
      const [rows] = await conn.query(sql, [email]);
      return rows[0] || null;
    }
    const rows = await this.db.query(sql, [email]);
    return rows[0] || null;
  }

  async createUser(conn, { nombre, apellido, email, password, idRol }) {
    const sql = 'INSERT INTO usuarios (nombre, apellido, email, password, idRol) VALUES (?, ?, ?, ?, ?)';
    const [result] = await conn.query(sql, [nombre, apellido, email, password, idRol]);
    return result.insertId;
  }

  async deleteUser(conn, idUsuario) {
    await conn.query('DELETE FROM usuarios WHERE idUsuario = ?', [idUsuario]);
  }
}

module.exports = { UserRepository };
