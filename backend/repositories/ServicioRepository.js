const { BaseRepository } = require('./BaseRepository');

class ServicioRepository extends BaseRepository {
  async listAll() {
    const sql = `
      SELECT 
        s.*, u.nombre, u.apellido, u.email
      FROM solicitudes_servicio_postventa s
      JOIN usuarios u ON s.idUsuario = u.idUsuario
      ORDER BY s.fechaCreacion DESC
    `;
    return this.db.query(sql);
  }

  async listByUsuario(idUsuario) {
    const sql = `
      SELECT * FROM solicitudes_servicio_postventa 
      WHERE idUsuario = ?
      ORDER BY fechaCreacion DESC
    `;
    return this.db.query(sql, [idUsuario]);
  }

  async createSolicitud({ idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida }) {
    const sql = `
      INSERT INTO solicitudes_servicio_postventa 
      (idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await this.db.query(sql, [idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida]);
    return result.insertId;
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
