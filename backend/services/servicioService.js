const { Database } = require('../core/database');
const { AppError } = require('../core/errors');
const { ServicioRepository } = require('../repositories/ServicioRepository');

const TIPOS_VALIDOS = ['instalacion', 'mantenimiento', 'garantia'];

class ServicioService {
  constructor(db = new Database()) {
    this.db = db;
    this.repo = new ServicioRepository(db);
  }

  async listAll() { return this.repo.listAll(); }
  async listMine(user) { return this.repo.listByUsuario(user.idUsuario); }

  async create(user, payload) {
    const { tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida } = payload;
    if (!tipoServicio || !descripcion || !direccion) throw AppError.badRequest('Faltan campos obligatorios: tipoServicio, descripcion, direccion');
    if (descripcion.length > 500) throw AppError.badRequest('La descripción no puede exceder 500 caracteres');
    if (!TIPOS_VALIDOS.includes(tipoServicio)) throw AppError.badRequest('Tipo de servicio no válido');
    const idSolicitud = await this.repo.createSolicitud({ idUsuario: user.idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida });
    return { idSolicitud };
  }

  async updateEstado(idSolicitud, { estado, observacionesAdmin }) {
    const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'en_proceso', 'completado', 'cancelado'];
    if (!ESTADOS_VALIDOS.includes(estado)) throw AppError.badRequest('Estado no válido');
    const affected = await this.repo.updateEstado({ idSolicitud, estado, observacionesAdmin });
    if (affected === 0) throw AppError.notFound('Solicitud no encontrada');
    return { updated: true };
  }

  tipos() {
    return [
      { value: 'instalacion', label: 'Instalación de producto', descripcion: 'Instalación profesional de productos adquiridos' },
      { value: 'mantenimiento', label: 'Mantenimiento', descripcion: 'Mantenimiento preventivo y revisión técnica' },
      { value: 'garantia', label: 'Arreglo de un producto por garantía', descripcion: 'Reparación de productos bajo garantía' },
    ];
  }
}

module.exports = { ServicioService };
