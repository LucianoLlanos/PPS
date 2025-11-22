import { ApiClient } from './ApiClient';

export class CustomersService {
  constructor(client = new ApiClient()) { this.client = client; }
  async list() { return this.client.get('/admin/clientes'); }
  async update(idCliente, payload) { return this.client.put(`/admin/clientes/${idCliente}`, payload); }
  async createMinimal(payload) { return this.client.post('/seller/clients/minimal', payload); }
}
