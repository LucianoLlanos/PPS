import { ApiClient } from './ApiClient';
import { Product } from '../domain/Product';

export class ProductsService {
  constructor(client = new ApiClient()) {
    this.client = client;
  }
  async listPublic() {
    const data = await this.client.get('/productos');
    return Array.isArray(data) ? data.map(d => new Product(d)) : [];
  }
  async getPublicById(id) {
    const d = await this.client.get(`/productos/${id}`);
    return d ? new Product(d) : null;
  }
  // Admin
  async listAdmin() {
    const data = await this.client.get('/admin/productos');
    return Array.isArray(data) ? data.map(d => new Product({
      idProducto: d.idProducto,
      nombre: d.nombre,
      tipo: d.tipo,
      descripcion: d.descripcion,
      precio: d.precio,
      stock: d.stock,
      imagen: d.imagen,
      imagenes: d.imagenes
    })) : [];
  }
  async createAdmin(formData) {
    return this.client.post('/admin/productos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  async updateAdmin(id, payloadOrFormData, isMultipart = false) {
    if (isMultipart) {
      return this.client.put(`/admin/productos/${id}`, payloadOrFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return this.client.put(`/admin/productos/${id}`, payloadOrFormData);
  }
  async deleteAdmin(id) { return this.client.delete(`/admin/productos/${id}`); }
}
