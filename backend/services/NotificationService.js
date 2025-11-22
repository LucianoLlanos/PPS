const { Database } = require('../core/database');
const { NotificationRepository } = require('../repositories/NotificationRepository');

class NotificationService {
  constructor(db = new Database()) {
    this.db = db;
    this.repo = new NotificationRepository(db);
  }

  async createNotification(payload, conn = null) {
    return this.repo.create(payload, conn);
  }

  async countUnread(destinatarioRol = 'Administrador') {
    return this.repo.countUnread(destinatarioRol);
  }

  async listForRole(destinatarioRol = 'Administrador', limit = 50, offset = 0) {
    return this.repo.listForRole(destinatarioRol, limit, offset);
  }

  async markAsRead(idNotificacion) {
    return this.repo.markRead(idNotificacion);
  }
}

module.exports = { NotificationService };
