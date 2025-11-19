const { BaseRepository } = require('./BaseRepository');

class EmpresaRepository extends BaseRepository {
  async getLatestInfo() {
    const sql = 'SELECT * FROM empresa_info ORDER BY fecha_actualizacion DESC LIMIT 1';
    const rows = await this.db.query(sql);
    return rows[0] || null;
  }

  async getOneAny() {
    const rows = await this.db.query('SELECT * FROM empresa_info LIMIT 1');
    return rows[0] || null;
  }

  async insertInfo({ vision, mision, composicion, archivo_pdf, actualizado_por }) {
    const sql = `INSERT INTO empresa_info (vision, mision, composicion, archivo_pdf, actualizado_por) VALUES (?, ?, ?, ?, ?)`;
    const result = await this.db.query(sql, [vision, mision, composicion, archivo_pdf, actualizado_por]);
    return result.insertId;
  }

  async updateInfo({ id, vision, mision, composicion, archivo_pdf, actualizado_por }) {
    if (typeof archivo_pdf !== 'undefined') {
      const sql = `UPDATE empresa_info SET vision = ?, mision = ?, composicion = ?, archivo_pdf = ?, actualizado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`;
      const result = await this.db.query(sql, [vision, mision, composicion, archivo_pdf, actualizado_por, id]);
      return result.affectedRows || 0;
    } else {
      const sql = `UPDATE empresa_info SET vision = ?, mision = ?, composicion = ?, actualizado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`;
      const result = await this.db.query(sql, [vision, mision, composicion, actualizado_por, id]);
      return result.affectedRows || 0;
    }
  }

  async getLatestPdf() {
    const rows = await this.db.query('SELECT id, archivo_pdf FROM empresa_info ORDER BY fecha_actualizacion DESC LIMIT 1');
    return rows[0] || null;
  }

  async setPdfNull(id, actualizado_por) {
    const sql = 'UPDATE empresa_info SET archivo_pdf = NULL, actualizado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await this.db.query(sql, [actualizado_por, id]);
    return result.affectedRows || 0;
  }
}

module.exports = { EmpresaRepository };
