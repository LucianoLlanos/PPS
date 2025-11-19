const { Database } = require('../../core/database');
const { ServicioPostventaRepository } = require('../../repositories/admin/ServicioPostventaRepository');

class ServiciosPostventaService {
  constructor(db = new Database()) {
    this.db = db;
    this.repo = new ServicioPostventaRepository(db);
  }

  async listarServicios() { return this.repo.listAll(); }
}

module.exports = { ServiciosPostventaService };