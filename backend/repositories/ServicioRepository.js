const { BaseRepository } = require('./BaseRepository');

class ServicioRepository extends BaseRepository {
  async listAll() {
    const sql = `
      SELECT 
        s.*, u.nombre, u.apellido, u.email,
        sd.productoTipo, sd.distanciaKm, sd.provincia
      FROM solicitudes_servicio_postventa s
      LEFT JOIN solicitudes_servicio_detalle sd ON sd.idSolicitud = s.idSolicitud
      JOIN usuarios u ON s.idUsuario = u.idUsuario
      ORDER BY s.fechaCreacion DESC
    `;
    return this.db.query(sql);
  }

  async listByUsuario(idUsuario) {
    const sql = `
      SELECT s.*, sd.productoTipo, sd.distanciaKm, sd.provincia
      FROM solicitudes_servicio_postventa s
      LEFT JOIN solicitudes_servicio_detalle sd ON sd.idSolicitud = s.idSolicitud
      WHERE s.idUsuario = ?
      ORDER BY s.fechaCreacion DESC
    `;
    return this.db.query(sql, [idUsuario]);
  }

  async getById(idSolicitud) {
    const sql = `
      SELECT s.*, u.nombre, u.apellido, u.email, c.telefono as clienteTelefono,
             sd.productoTipo, sd.distanciaKm, sd.provincia
      FROM solicitudes_servicio_postventa s
      JOIN usuarios u ON s.idUsuario = u.idUsuario
      LEFT JOIN solicitudes_servicio_detalle sd ON sd.idSolicitud = s.idSolicitud
      LEFT JOIN clientes c ON c.idUsuario = u.idUsuario
      WHERE s.idSolicitud = ?
      LIMIT 1
    `;
    try {
      const rows = await this.db.query(sql, [idSolicitud]);
      return rows && rows[0] ? rows[0] : null;
    } catch (err) {
      console.error('[ServicioRepository] getById error', err && err.message ? err.message : err);
      throw err;
    }
  }

  async createSolicitud({ idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida, productoTipo, distanciaKm, provincia }) {
    const sql = `
      INSERT INTO solicitudes_servicio_postventa 
      (idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await this.db.query(sql, [idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida]);
    const idSolicitud = result.insertId;
    // Insertar detalle opcional si hay datos
    if (productoTipo || distanciaKm !== undefined || provincia) {
      const sqlDetalle = `
        INSERT INTO solicitudes_servicio_detalle (idSolicitud, productoTipo, distanciaKm, provincia)
        VALUES (?, ?, ?, ?)
      `;
      await this.db.query(sqlDetalle, [idSolicitud, productoTipo || null, distanciaKm !== undefined ? distanciaKm : null, provincia || null]);
    }
    return idSolicitud;
  }

  async updateEstado({ idSolicitud, estado, observacionesAdmin }) {
    const sql = `
      UPDATE solicitudes_servicio_postventa 
      SET estado = ?, observacionesAdmin = ?, fechaActualizacion = NOW()
      WHERE idSolicitud = ?
    `;
    const result = await this.db.query(sql, [estado, observacionesAdmin, idSolicitud]);
    return result.affectedRows || 0;
  }
}

module.exports = { ServicioRepository };
