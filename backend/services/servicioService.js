const { Database } = require('../core/database');
const { AppError } = require('../core/errors');
const { ServicioRepository } = require('../repositories/ServicioRepository');
const { NotificationService } = require('./NotificationService');

const TIPOS_VALIDOS = ['instalacion', 'mantenimiento', 'garantia'];

class ServicioService {
  constructor(db = new Database()) {
    this.db = db;
    this.repo = new ServicioRepository(db);
    this.notif = new NotificationService(db);
  }

  async listAll() { return this.repo.listAll(); }
  async listMine(user) { return this.repo.listByUsuario(user.idUsuario); }
  async getById(id) { return this.repo.getById(id); }
  async getByIdSafe(id) {
    try {
      return await this.repo.getById(id);
    } catch (err) {
      console.error('[ServicioService] getById error', err && err.message ? err.message : err);
      throw err;
    }
  }

  async create(user, payload) {
    const { tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida } = payload;
    if (!tipoServicio || !descripcion || !direccion) throw AppError.badRequest('Faltan campos obligatorios: tipoServicio, descripcion, direccion');
    if (descripcion.length > 500) throw AppError.badRequest('La descripción no puede exceder 500 caracteres');
    if (!TIPOS_VALIDOS.includes(tipoServicio)) throw AppError.badRequest('Tipo de servicio no válido');
    const idSolicitud = await this.repo.createSolicitud({ idUsuario: user.idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida });

    // Si el usuario proporcionó un teléfono en la solicitud, vinculamos ese número
    // con su registro de cliente para que aparezca en su perfil y en las tarjetas de admin.
    let phoneUpdated = false;
    try {
      if (telefono && String(telefono).trim().length > 0) {
        // sólo actualizar si actualmente no tiene teléfono
        const rows = await this.db.query('SELECT telefono FROM clientes WHERE idUsuario = ?', [user.idUsuario]);
        const current = rows && rows[0] ? rows[0].telefono : null;
        if (!current || String(current).trim() === '') {
          await this.db.query('UPDATE clientes SET telefono = ? WHERE idUsuario = ?', [String(telefono).trim(), user.idUsuario]);
          phoneUpdated = true;
        }
      }
    } catch (e) {
      console.warn('[ServicioService] No se pudo actualizar teléfono del cliente:', e && e.message ? e.message : e);
    }

    // Crear notificación para administradores
    try {
      const mensaje = `Nueva solicitud de servicio (${tipoServicio}) de ${user.nombre || ''} ${user.apellido || ''}`.trim();
      await this.notif.createNotification({ tipo: 'servicio', referenciaId: idSolicitud, mensaje, destinatarioRol: 'Administrador', metadata: { idUsuario: user.idUsuario } });
    } catch (e) {
      console.warn('[Notification] No se pudo crear notificación de servicio:', e && e.message ? e.message : e);
    }

    return { idSolicitud, phoneUpdated };
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
