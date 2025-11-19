import { ApiClient } from './ApiClient';
import { Order } from '../domain/Order';

export class OrdersAdminService {
  constructor(client = new ApiClient()) { this.client = client; }
  async list(params) {
    const query = params ? ('?' + new URLSearchParams(params).toString()) : '';
    const data = await this.client.get('/admin/pedidos' + query);
    return Array.isArray(data) ? data.map(o => new Order(o)) : [];
  }
  async create(payload) { return this.client.post('/admin/pedidos', payload); }
  async getById(id) { const data = await this.client.get(`/admin/pedidos/${id}`); return data; }
  async update(id, payload) { return this.client.put(`/admin/pedidos/${id}`, payload); }
  async remove(id) { return this.client.delete(`/admin/pedidos/${id}`); }
}
