import { ApiClient } from './ApiClient';

export class EmpresaService {
  constructor(client = new ApiClient()) { this.client = client; }

  // Info de empresa (datos generales + PDF)
  async getInfo() { return this.client.get('/empresa'); }
  async updateInfo(formData) { return this.client.put('/empresa', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); }
  async downloadPdf() { return this.client.get('/empresa/pdf', { responseType: 'blob' }); }
  async deletePdf() { return this.client.delete('/empresa/pdf'); }

  // Organización / cargos
  async listarCargos() { return this.client.get('/empresa/cargo'); }
  async crearCargo(payloadFormData) { return this.client.post('/empresa/cargo', payloadFormData, { headers: { 'Content-Type': 'multipart/form-data' } }); }
  async actualizarCargo(idCargo, payloadFormData) { return this.client.put(`/empresa/cargo/${idCargo}`, payloadFormData, { headers: { 'Content-Type': 'multipart/form-data' } }); }
  async eliminarCargo(idCargo) { return this.client.delete(`/empresa/cargo/${idCargo}`); }
  async getOrganizacion() { return this.client.get('/empresa/organizacion'); }

  // Foto por cargo (si aplica endpoints separados)
  async obtenerFotoCargo(idCargo) { return this.client.get(`/empresa/cargos/${idCargo}/foto`, { responseType: 'blob' }); }
  async subirFotoCargo(idCargo, file) {
    const form = new FormData();
    form.append('foto', file);
    return this.client.post(`/empresa/cargos/${idCargo}/foto`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
}
