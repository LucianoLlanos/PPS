const { ServiciosPostventaService } = require('../../services/admin/ServiciosPostventaService');

class ServiciosPostventaController {
  constructor(service = new ServiciosPostventaService()) {
    this.service = service;
    this.listarServicios = this.listarServicios.bind(this);
  }

  async listarServicios(req, res) {
    try {
      const rows = await this.service.listarServicios();
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Error al obtener servicios' });
    }
  }
}

module.exports = new ServiciosPostventaController();