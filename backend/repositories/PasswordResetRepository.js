const { BaseRepository } = require('./BaseRepository');

class PasswordResetRepository extends BaseRepository {
  async create({ idUsuario, tokenHash, expiresAt, ipRequest = null, userAgent = null }, conn = null) {
    const runner = conn ? conn.query.bind(conn) : this.db.query.bind(this.db);
    const sql = 'INSERT INTO password_resets (idUsuario, token_hash, expires_at, ip_request, user_agent) VALUES (?, ?, ?, ?, ?)';
    const result = await runner(sql, [idUsuario, tokenHash, expiresAt, ipRequest, userAgent]);
    // Depending on runner return shape
    if (result && result.insertId) return result.insertId;
    if (Array.isArray(result) && result[0] && result[0].insertId) return result[0].insertId;
    return null;
  }

  async findValidByUsuarioAndTokenHash(idUsuario, tokenHash) {
    const sql = 'SELECT * FROM password_resets WHERE idUsuario = ? AND token_hash = ? AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1';
    const rows = await this.db.query(sql, [idUsuario, tokenHash]);
    return rows && rows.length ? rows[0] : null;
  }

  async countRecentByUsuario(idUsuario, windowMinutes = 60) {
    const sql = 'SELECT COUNT(*) as cnt FROM password_resets WHERE idUsuario = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)';
    const rows = await this.db.query(sql, [idUsuario, Number(windowMinutes)]);
    return rows && rows.length ? Number(rows[0].cnt || 0) : 0;
  }

  async stats() {
    const total = await this.db.query('SELECT COUNT(*) as total FROM password_resets');
    const expired = await this.db.query('SELECT COUNT(*) as expired FROM password_resets WHERE expires_at <= NOW()');
    const used = await this.db.query('SELECT COUNT(*) as used FROM password_resets WHERE used = TRUE');
    return { total: total[0].total || 0, expired: expired[0].expired || 0, used: used[0].used || 0 };
  }

  async markUsed(id, conn = null) {
    const runner = conn ? conn.query.bind(conn) : this.db.query.bind(this.db);
    await runner('UPDATE password_resets SET used = TRUE WHERE id = ?', [id]);
  }

  async deleteExpired() {
    await this.db.query('DELETE FROM password_resets WHERE expires_at <= NOW() OR used = TRUE');
  }
}

module.exports = { PasswordResetRepository };
