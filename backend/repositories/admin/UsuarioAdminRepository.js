const { BaseRepository } = require('../BaseRepository');

class UsuarioAdminRepository extends BaseRepository {
  async findAllWithRolYCliente() {
    const sql = `SELECT u.*, r.nombreRol, c.direccion, c.telefono
                 FROM usuarios u
                 JOIN roles r ON u.idRol = r.idRol
                 LEFT JOIN clientes c ON c.idUsuario = u.idUsuario`;
    return this.db.query(sql);
  }

  async existsEmail(email, conn = null) {
    const sql = 'SELECT 1 FROM usuarios WHERE email=? LIMIT 1';
    const runner = conn ? conn.query.bind(conn) : this.db.query.bind(this.db);
    const result = await runner(sql, [email]);
    // If runner is a raw connection method it returns [rows, fields]; normalize
    const rows = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;
    return rows && rows.length > 0;
  }

  async insertUser({ nombre, apellido, email, password, idRol }, conn) {
    const [res] = await conn.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, idRol) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido, email, password, idRol]
    );
    return res.insertId;
  }

  async insertClienteForUsuario(idUsuario, { direccion = null, telefono = null }, conn) {
    await conn.query('INSERT INTO clientes (idUsuario, direccion, telefono) VALUES (?, ?, ?)', [idUsuario, direccion, telefono]);
  }

  async findById(id, conn = null) {
    const sql = 'SELECT * FROM usuarios WHERE idUsuario=?';
    const runner = conn ? conn.query.bind(conn) : this.db.query.bind(this.db);
    const rows = await runner(sql, [id]);
    return rows && rows[0] ? rows[0] : null;
  }

  async updateUser(id, { nombre, apellido, email, password, idRol }, conn) {
    await conn.query('UPDATE usuarios SET nombre=?, apellido=?, email=?, password=?, idRol=? WHERE idUsuario=?', [nombre, apellido, email, password, idRol, id]);
  }

  async clienteExistsForUsuario(idUsuario, conn) {
    const [rows] = await conn.query('SELECT 1 FROM clientes WHERE idUsuario=? LIMIT 1', [idUsuario]);
    return rows && rows.length > 0;
  }

  async updateClienteByUsuario(idUsuario, { direccion = null, telefono = null }, conn) {
    await conn.query('UPDATE clientes SET direccion=?, telefono=? WHERE idUsuario=?', [direccion, telefono, idUsuario]);
  }

  async insertClienteByUsuario(idUsuario, { direccion = null, telefono = null }, conn) {
    await conn.query('INSERT INTO clientes (idUsuario, direccion, telefono) VALUES (?, ?, ?)', [idUsuario, direccion, telefono]);
  }

  async deleteUser(id, conn) {
    await conn.query('DELETE FROM usuarios WHERE idUsuario=?', [id]);
  }
}

module.exports = { UsuarioAdminRepository };
