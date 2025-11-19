const { Database } = require('../../core/database');
const { ClienteAdminRepository } = require('../../repositories/admin/ClienteAdminRepository');
const { HistorialRepository } = require('../../repositories/admin/HistorialRepository');

class ClientsAdminService {
  constructor(db = new Database()) {
    this.db = db;
    this.repo = new ClienteAdminRepository(db);
    this.historialRepo = new HistorialRepository(db);
  }

  async listarClientes() { return this.repo.list(); }

  async verCliente(id) { return this.repo.findById(id); }

  async actualizarCliente(id, { direccion, telefono }) {
    await this.repo.updateById(id, { direccion, telefono });
    await this.historialRepo.insert('clientes', id, 'actualizar', null, `Cliente actualizado: ${id}`);
  }
}

module.exports = { ClientsAdminService };