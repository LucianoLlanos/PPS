const { BaseRepository } = require('../BaseRepository');

class SucursalAdminRepository extends BaseRepository {
  async listAll() {
    return this.db.query('SELECT * FROM sucursales');
  }

  async listIds(conn = null) {
    const runner = conn ? conn.query.bind(conn) : this.db.query.bind(this.db);
    const rows = await runner('SELECT idSucursal FROM sucursales');
    return rows.map(r => r.idSucursal);
  }
}

module.exports = { SucursalAdminRepository };
