const { SucursalesAdminService } = require('../../services/admin/SucursalesAdminService');

class SucursalesAdminController {
  constructor(service = new SucursalesAdminService()) {
    this.service = service;
    this.listarSucursales = this.listarSucursales.bind(this);
  }

  async listarSucursales(req, res) {
    try {
      const rows = await this.service.listarSucursales();
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Error al obtener sucursales' });
    }
  }
}

module.exports = new SucursalesAdminController();