const { BaseRepository } = require('../BaseRepository');

class ServicioPostventaRepository extends BaseRepository {
  async listAll() {
    return this.db.query('SELECT * FROM servicios_postventa');
  }
}

module.exports = { ServicioPostventaRepository };
