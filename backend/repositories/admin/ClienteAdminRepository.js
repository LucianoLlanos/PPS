const { BaseRepository } = require('../BaseRepository');

class ClienteAdminRepository extends BaseRepository {
  async list() {
    const sql = `SELECT c.*, u.nombre, u.apellido, u.email
                 FROM clientes c JOIN usuarios u ON c.idUsuario = u.idUsuario`;
    return this.db.query(sql);
  }

  async findById(id) {
    const sql = `SELECT c.*, u.nombre, u.apellido, u.email
                 FROM clientes c JOIN usuarios u ON c.idUsuario = u.idUsuario
                 WHERE c.idCliente = ?`;
    const rows = await this.db.query(sql, [id]);
    return rows[0] || null;
  }

  async updateById(id, { direccion = null, telefono = null }) {
    await this.db.query('UPDATE clientes SET direccion=?, telefono=? WHERE idCliente=?', [direccion, telefono, id]);
  }
}

module.exports = { ClienteAdminRepository };
