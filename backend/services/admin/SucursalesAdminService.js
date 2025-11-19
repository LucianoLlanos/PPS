const { Database } = require('../../core/database');
const { SucursalAdminRepository } = require('../../repositories/admin/SucursalAdminRepository');

class SucursalesAdminService {
  constructor(db = new Database()) {
    this.db = db;
    this.repo = new SucursalAdminRepository(db);
  }

  async listarSucursales() { return this.repo.listAll(); }
}

module.exports = { SucursalesAdminService };