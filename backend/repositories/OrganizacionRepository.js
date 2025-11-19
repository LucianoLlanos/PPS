const { BaseRepository } = require('./BaseRepository');

class OrganizacionRepository extends BaseRepository {
  async getActive() {
    const sql = `SELECT id, nombre_cargo, descripcion, nivel_jerarquico, foto, orden_en_nivel, activo
                 FROM organizacion_cargos WHERE activo = TRUE ORDER BY nivel_jerarquico ASC, orden_en_nivel ASC`;
    return this.db.query(sql);
  }

  async getById(id) {
    const rows = await this.db.query('SELECT * FROM organizacion_cargos WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async insert({ nombre_cargo, descripcion, nivel_jerarquico, foto, orden_en_nivel }) {
    const sql = `INSERT INTO organizacion_cargos (nombre_cargo, descripcion, nivel_jerarquico, foto, orden_en_nivel)
                 VALUES (?, ?, ?, ?, ?)`;
    const result = await this.db.query(sql, [nombre_cargo, descripcion, nivel_jerarquico, foto, orden_en_nivel || 0]);
    return result.insertId;
  }

  async update({ id, nombre_cargo, descripcion, nivel_jerarquico, foto, orden_en_nivel }) {
    if (typeof foto !== 'undefined') {
      const sql = `UPDATE organizacion_cargos SET nombre_cargo=?, descripcion=?, nivel_jerarquico=?, foto=?, orden_en_nivel=?, fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?`;
      const result = await this.db.query(sql, [nombre_cargo, descripcion, nivel_jerarquico, foto, orden_en_nivel || 0, id]);
      return result.affectedRows || 0;
    } else {
      const sql = `UPDATE organizacion_cargos SET nombre_cargo=?, descripcion=?, nivel_jerarquico=?, orden_en_nivel=?, fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?`;
      const result = await this.db.query(sql, [nombre_cargo, descripcion, nivel_jerarquico, orden_en_nivel || 0, id]);
      return result.affectedRows || 0;
    }
  }

  async remove(id) {
    const result = await this.db.query('DELETE FROM organizacion_cargos WHERE id = ?', [id]);
    return result.affectedRows || 0;
  }
}

module.exports = { OrganizacionRepository };
