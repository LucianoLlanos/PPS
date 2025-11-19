import { ApiClient } from './ApiClient';

export class UsersAdminService {
  constructor(client = new ApiClient()) { this.client = client; }
  async list() { return this.client.get('/admin/usuarios'); }
  async create(payload) { return this.client.post('/admin/usuarios', payload); }
  async update(id, payload) { return this.client.put(`/admin/usuarios/${id}`, payload); }
  async remove(id) { return this.client.delete(`/admin/usuarios/${id}`); }
}
