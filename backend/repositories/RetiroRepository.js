const { Database } = require('../core/database');

class RetiroRepository {
  constructor(db = new Database()) {
    this.db = db;
  }

  async create({ idPedido, codigo, telefono = null, creadoPor = null }) {
    const conn = await this.db.getConnection();
    try {
      const [res] = await conn.query('INSERT INTO retiros_pedido (idPedido, codigo, telefono, creadoPor) VALUES (?, ?, ?, ?)', [idPedido, codigo, telefono || null, creadoPor || null]);
      return { idRetiro: res.insertId, idPedido, codigo, telefono, creadoPor };
    } finally {
      try { conn.release(); } catch (_) {}
    }
  }

  async getByCodigo(codigo) {
    const rows = await this.db.query('SELECT * FROM retiros_pedido WHERE codigo = ? LIMIT 1', [codigo]);
    return rows && rows.length ? rows[0] : null;
  }

  async getByPedido(idPedido) {
    const rows = await this.db.query('SELECT * FROM retiros_pedido WHERE idPedido = ? LIMIT 1', [idPedido]);
    return rows && rows.length ? rows[0] : null;
  }
}

module.exports = new RetiroRepository();
