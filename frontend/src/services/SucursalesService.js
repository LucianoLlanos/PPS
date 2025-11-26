import { ApiClient } from './ApiClient';
import { Sucursal } from '../domain/Sucursal';

export class SucursalesService {
  constructor(client = new ApiClient()) { this.client = client; }
  async list() {
    try {
      const data = await this.client.get('/sucursales');
      return Array.isArray(data) ? data.map(s => new Sucursal(s)) : [];
    } catch (e) {
      // Fallback para entornos donde aún no está el endpoint público y el usuario tiene rol admin/vendedor
      try {
        const dataAdmin = await this.client.get('/admin/sucursales');
        return Array.isArray(dataAdmin) ? dataAdmin.map(s => new Sucursal(s)) : [];
      } catch {
        return [];
      }
    }
  }
}
