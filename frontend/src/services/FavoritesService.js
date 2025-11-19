import { ApiClient } from './ApiClient';

export class FavoritesService {
  constructor(client = new ApiClient()) { this.client = client; }
  async list() { return this.client.get('/favorites'); }
  async add(idProducto) { return this.client.post('/favorites', { idProducto }); }
  async remove(idProducto) { return this.client.delete(`/favorites/${idProducto}`); }
}
