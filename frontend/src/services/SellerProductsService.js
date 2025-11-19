import { ApiClient } from './ApiClient';

export class SellerProductsService {
  constructor(client = new ApiClient()) { this.client = client; }
  async list() { return this.client.get('/seller/products'); }
  async create(formData) { return this.client.post('/seller/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); }
  async update(id, formData) { return this.client.put(`/seller/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); }
  async remove(id) { return this.client.delete(`/seller/products/${id}`); }
}
