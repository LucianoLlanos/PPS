const { BaseRepository } = require('./BaseRepository');

class CarouselRepository extends BaseRepository {
  async findPublic() {
    const sql = `SELECT id, titulo, descripcion, imagen, enlace, orden FROM banners_carousel WHERE activo = true ORDER BY orden ASC, fecha_creacion DESC`;
    return this.db.query(sql);
  }

  async findAll() {
    const sql = `SELECT * FROM banners_carousel ORDER BY orden ASC, fecha_creacion DESC`;
    return this.db.query(sql);
  }

  async create({ titulo, descripcion, imagen, enlace, orden, activo }) {
    const sql = `INSERT INTO banners_carousel (titulo, descripcion, imagen, enlace, orden, activo) VALUES (?, ?, ?, ?, ?, ?)`;
    const result = await this.db.query(sql, [titulo, descripcion || null, imagen, enlace || null, parseInt(orden) || 0, !!activo]);
    return result.insertId;
  }

  async update({ id, titulo, descripcion, imagen, enlace, orden, activo }) {
    let sql, params;
    if (imagen) {
      sql = `UPDATE banners_carousel SET titulo = ?, descripcion = ?, imagen = ?, enlace = ?, orden = ?, activo = ? WHERE id = ?`;
      params = [titulo, descripcion || null, imagen, enlace || null, parseInt(orden) || 0, !!activo, id];
    } else {
      sql = `UPDATE banners_carousel SET titulo = ?, descripcion = ?, enlace = ?, orden = ?, activo = ? WHERE id = ?`;
      params = [titulo, descripcion || null, enlace || null, parseInt(orden) || 0, !!activo, id];
    }
    const result = await this.db.query(sql, params);
    return result.affectedRows || 0;
  }

  async remove(id) {
    const result = await this.db.query('DELETE FROM banners_carousel WHERE id = ?', [id]);
    return result.affectedRows || 0;
  }

  async setActive(id, activo) {
    const result = await this.db.query('UPDATE banners_carousel SET activo = ? WHERE id = ?', [!!activo, id]);
    return result.affectedRows || 0;
  }

  async updateOrder(entries) {
    // entries: [{id, orden}]
    const updates = entries.map((b) => this.db.query('UPDATE banners_carousel SET orden = ? WHERE id = ?', [b.orden, b.id]));
    await Promise.all(updates);
  }
}

module.exports = { CarouselRepository };
