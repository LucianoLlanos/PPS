const { BaseRepository } = require('./BaseRepository');

class NotificationRepository extends BaseRepository {
  constructor(db) {
    super(db);
  }

  async create({ tipo, referenciaId = null, mensaje, destinatarioRol = 'Administrador', destinatarioId = null, metadata = null }, conn = null) {
    const meta = metadata ? JSON.stringify(metadata) : null;
    const sql = `INSERT INTO notificaciones (tipo, referenciaId, mensaje, destinatarioRol, destinatarioId, metadata) VALUES (?, ?, ?, ?, ?, ?)`;
      let insertId = null;
      if (conn) {
        const [res] = await conn.query(sql, [tipo, referenciaId, mensaje, destinatarioRol, destinatarioId, meta]);
        insertId = res.insertId;
      } else {
        const res = await this.db.query(sql, [tipo, referenciaId, mensaje, destinatarioRol, destinatarioId, meta]);
        insertId = res && res.insertId ? res.insertId : null;
      }

      // Emitir evento websocket para administradores si está disponible
      try {
        const { getIO } = require('../core/socket');
        const io = getIO();
        console.debug('[NotificationRepository] emit: ioPresent=', !!io, 'insertId=', insertId);
        if (io && insertId) {
          // obtener la fila recién insertada
          const rows = conn ? (await conn.query('SELECT * FROM notificaciones WHERE idNotificacion = ?', [insertId]))[0] : await this.db.query('SELECT * FROM notificaciones WHERE idNotificacion = ?', [insertId]);
          const row = Array.isArray(rows) ? rows[0] : rows;
          try {
            io.to('admins').emit('notification', row);
            console.debug('[NotificationRepository] emitted notification to admins:', row && row.idNotificacion);
          } catch (emitErr) {
            console.warn('[NotificationRepository] emit failed', emitErr && emitErr.message ? emitErr.message : emitErr);
          }
        }
      } catch (e) {
        // no bloquear por errores de emisión
        console.warn('Notification emit failed', e && e.message ? e.message : e);
      }

      return insertId;
  }

  async countUnread(destinatarioRol = 'Administrador') {
    const rows = await this.db.query(`SELECT COUNT(*) AS cnt FROM notificaciones WHERE destinatarioRol = ? AND estado = 'pendiente'`, [destinatarioRol]);
    return rows && rows[0] ? Number(rows[0].cnt) : 0;
  }

  async listForRole(destinatarioRol = 'Administrador', limit = 50, offset = 0) {
    const rows = await this.db.query(`SELECT * FROM notificaciones WHERE destinatarioRol = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`, [destinatarioRol, Number(limit), Number(offset)]);
    return rows || [];
  }

  async markRead(idNotificacion, conn = null) {
    if (conn) {
      await conn.query('UPDATE notificaciones SET estado = "leida", read_at = NOW() WHERE idNotificacion = ?', [idNotificacion]);
      return;
    }
    await this.db.query('UPDATE notificaciones SET estado = "leida", read_at = NOW() WHERE idNotificacion = ?', [idNotificacion]);
  }
}

module.exports = { NotificationRepository };
