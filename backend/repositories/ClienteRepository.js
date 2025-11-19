const { BaseRepository } = require('./BaseRepository');

class ClienteRepository extends BaseRepository {
  async findIdByUsuarioId(idUsuario, conn = null) {
    const sql = 'SELECT idCliente FROM clientes WHERE idUsuario = ?';
    const runner = conn ? conn.query.bind(conn) : this.db.pool.query.bind(this.db.pool);
    const [rows] = await runner(sql, [idUsuario]);
    return rows && rows[0] ? rows[0].idCliente : null;
  }
}

module.exports = { ClienteRepository };
