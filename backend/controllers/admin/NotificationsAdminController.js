const { NotificationService } = require('../../services/NotificationService');

class NotificationsAdminController {
  constructor(service = new NotificationService()) {
    this.service = service;
    this.countUnread = this.countUnread.bind(this);
    this.list = this.list.bind(this);
    this.markRead = this.markRead.bind(this);
    this.testNotification = this.testNotification.bind(this);
  }

  async countUnread(req, res) {
    try {
      const count = await this.service.countUnread('Administrador');
      res.json({ count });
    } catch (err) {
      console.error('countUnread error', err);
      res.status(500).json({ error: 'Error al contar notificaciones' });
    }
  }

  async list(req, res) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Number(req.query.limit || 50));
      const offset = (page - 1) * limit;
      const rows = await this.service.listForRole('Administrador', limit, offset);
      res.json(rows);
    } catch (err) {
      console.error('list notifications error', err);
      res.status(500).json({ error: 'Error al listar notificaciones' });
    }
  }

  async markRead(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'Falta id de notificación' });
      await this.service.markAsRead(Number(id));
      res.json({ mensaje: 'Notificación marcada como leída' });
    } catch (err) {
      console.error('markRead error', err);
      res.status(500).json({ error: 'Error al marcar notificación' });
    }
  }

  // Endpoint de prueba para emitir una notificación a los admins (solo para testing)
  async testNotification(req, res) {
    try {
      const uid = req.user ? req.user.idUsuario : null;
      const { mensaje, tipo } = req.body || {};
      const msg = mensaje || `Notificación de prueba desde usuario ${uid || 'anon'}`;
      const t = tipo || 'test';
      const notifId = await this.service.createNotification({ tipo: t, referenciaId: null, mensaje: msg, destinatarioRol: 'Administrador', metadata: { idUsuario: uid } });
      res.json({ mensaje: 'Notificación de prueba creada', id: notifId });
    } catch (err) {
      console.error('testNotification error', err);
      res.status(500).json({ error: 'Error al crear notificación de prueba' });
    }
  }
}

module.exports = new NotificationsAdminController();
