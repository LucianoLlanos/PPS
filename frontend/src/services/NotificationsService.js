import { ApiClient } from './ApiClient';
import { io as ioClient } from 'socket.io-client';
import api from '../api/axios';

class NotificationsService {
  constructor(client = new ApiClient()) {
    this.client = client;
    this.socket = null;
    this.listeners = [];
  }

  async countUnread() {
    const res = await this.client.get('/admin/notifications/count-unread');
    return res && res.count ? Number(res.count) : 0;
  }

  async list({ page = 1, limit = 20 } = {}) {
    const res = await this.client.get('/admin/notifications', { params: { page, limit } });
    return res || [];
  }

  async markRead(id) {
    const res = await this.client.post(`/admin/notifications/${id}/mark-read`);
    return res;
  }

  init(token) {
    try {
      if (this.socket) {
        // update auth and reconnect
        if (token) {
          this.socket.auth = { token };
          if (!this.socket.connected) this.socket.connect();
          // emit authenticate to join server-side rooms (some servers expect explicit authenticate event)
          try { this.socket.emit('authenticate', { token }); } catch (e) {}
        } else {
          this.socket.disconnect();
        }
        return;
      }
      // Prefer backend baseURL from axios client (dev server runs frontend on different origin)
      const url = (api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL : ((window && window.location && window.location.origin) ? window.location.origin : '/');
      if (!url) {
        console.warn('NotificationsService: no backend URL available for socket connection');
      }
      this.socket = ioClient(url, { autoConnect: false, transports: ['websocket'] });
      if (token) this.socket.auth = { token };
      this.socket.connect();
      this.socket.on('connect', () => {
        console.debug('[NotificationsService] socket connected', this.socket.id, 'to', url);
        // After connecting, emit authenticate so backend can verify token and join rooms
        try {
          if (this.socket && this.socket.auth && this.socket.auth.token) {
            this.socket.emit('authenticate', { token: this.socket.auth.token });
          }
        } catch (e) {}
      });
      this.socket.on('authenticated', (payload) => {
        console.debug('[NotificationsService] socket authenticated', payload);
      });
      this.socket.on('connect_error', (err) => {
        console.warn('[NotificationsService] socket connect_error', err && err.message ? err.message : err);
      });
      this.socket.on('disconnect', (reason) => {
        console.debug('[NotificationsService] socket disconnected', reason);
      });
      this.socket.on('notification', (payload) => {
        console.debug('[NotificationsService] received notification', payload && payload.idNotificacion ? payload.idNotificacion : payload);
        // notify all listeners
        this.listeners.forEach(fn => {
          try { fn(payload); } catch (e) { console.warn('listener error', e); }
        });
      });
    } catch (e) {
      console.warn('NotificationsService.init error', e && e.message ? e.message : e);
    }
  }

  onNotification(cb) {
    if (typeof cb === 'function') this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(f => f !== cb); };
  }
}

export default new NotificationsService();
