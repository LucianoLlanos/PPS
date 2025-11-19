import { ApiClient } from './ApiClient';

export class ServiciosService {
  constructor(client = new ApiClient()) { this.client = client; }
  // Públicos / autenticados por usuario
  async getTipos() { return this.client.get('/servicios/tipos'); }
  async createSolicitud(payload) { return this.client.post('/servicios/solicitar', payload); }
  async misSolicitudes() { return this.client.get('/servicios/mis-solicitudes'); }
  // Admin
  async listAdmin() { return this.client.get('/servicios/admin/todas'); }
  async updateAdmin(idSolicitud, payload) { return this.client.put(`/servicios/admin/solicitud/${idSolicitud}`, payload); }
}
