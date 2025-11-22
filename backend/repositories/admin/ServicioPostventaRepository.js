const { BaseRepository } = require('../BaseRepository');

class ServicioPostventaRepository extends BaseRepository {
  async listAll() {
    return this.db.query('SELECT * FROM solicitudes_servicio_postventa');
  }
}

module.exports = { ServicioPostventaRepository };
