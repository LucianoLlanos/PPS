import { ApiClient } from './ApiClient';
import { Sucursal } from '../domain/Sucursal';

export class SucursalesService {
  constructor(client = new ApiClient()) { this.client = client; }
  async list() { const data = await this.client.get('/admin/sucursales'); return Array.isArray(data) ? data.map(s => new Sucursal(s)) : []; }
}
