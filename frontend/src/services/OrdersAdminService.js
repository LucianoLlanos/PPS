import { ApiClient } from './ApiClient';
import { Order } from '../domain/Order';

export class OrdersAdminService {
  constructor(client = new ApiClient()) { this.client = client; }
  async list(params) {
    const query = params ? ('?' + new URLSearchParams(params).toString()) : '';
    const data = await this.client.get('/admin/pedidos' + query);
    if (!Array.isArray(data)) return [];
    return data.map(o => {
      const ord = new Order(o);
      // preserve retiro info attached by backend (do not lose it in the domain mapping)
      ord.retiro = o.retiro || null;
      return ord;
    });
  }
  async create(payload) { return this.client.post('/admin/pedidos', payload); }
  async getById(id) {
    try {
      const q = await this.client.get(`/admin/pedidos?idPedido=${encodeURIComponent(id)}`);
      if (Array.isArray(q) && q.length > 0) {
        const ord = new Order(q[0]);
        ord.retiro = q[0].retiro || null;
        return ord;
      }
    } catch (e) {
      // fallthrough to try detalle endpoint
    }
    // Fallback: some backends expose only the detalle endpoint (list of products)
    try {
      const details = await this.client.get(`/admin/pedidos/${id}`);
      // details is expected to be an array of product rows
      if (Array.isArray(details)) {
        // Build a minimal order object from details: idPedido and productos
        const productos = details.map(d => ({ nombre: d.nombreProducto || d.nombre, cantidad: d.cantidad, precioUnitario: d.precioUnitario }));
        return { idPedido: id, productos };
      }
      return details;
    } catch (e) {
      throw e;
    }
  }
  async update(id, payload) { return this.client.put(`/admin/pedidos/${id}`, payload); }
  async remove(id) { return this.client.delete(`/admin/pedidos/${id}`); }
  async createRetiro(pedidoId, telefono) { return this.client.post(`/admin/pedidos/${encodeURIComponent(pedidoId)}/retiro`, { telefono }); }
}
