import { ApiClient } from './ApiClient';

export class CarouselService {
  constructor(client = new ApiClient()) { this.client = client; }
  // Públicos
  async listPublic() { return this.client.get('/carousel/public'); }
  // Admin CRUD
  async listAdmin() { return this.client.get('/carousel/admin'); }
  async uploadAdmin(formData) { return this.client.post('/carousel/admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); }
  async updateAdmin(id, formData) { return this.client.put(`/carousel/admin/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); }
  async removeAdmin(id) { return this.client.delete(`/carousel/admin/${id}`); }
  async toggleEstado(id, activo) { return this.client.patch(`/carousel/admin/${id}/estado`, { activo }); }
  async reorderAdmin(nuevos) { return this.client.put('/carousel/admin/reordenar', { orden: nuevos }); }
}
