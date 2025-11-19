const { ClientsAdminService } = require('../../services/admin/ClientsAdminService');

class ClientsAdminController {
  constructor(service = new ClientsAdminService()) {
    this.service = service;
    this.listarClientes = this.listarClientes.bind(this);
    this.verCliente = this.verCliente.bind(this);
    this.actualizarCliente = this.actualizarCliente.bind(this);
  }

  async listarClientes(req, res) {
    try {
      const rows = await this.service.listarClientes();
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Error al obtener clientes' });
    }
  }

  async verCliente(req, res) {
    try {
      const { id } = req.params;
      const row = await this.service.verCliente(id);
      if (!row) return res.status(404).json({ error: 'Cliente no encontrado' });
      res.json(row);
    } catch {
      res.status(500).json({ error: 'Error al obtener cliente' });
    }
  }

  async actualizarCliente(req, res) {
    try {
      const { id } = req.params;
      const { direccion, telefono } = req.body;
      await this.service.actualizarCliente(id, { direccion, telefono });
      res.json({ mensaje: 'Cliente actualizado' });
    } catch {
      res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  }
}

module.exports = new ClientsAdminController();