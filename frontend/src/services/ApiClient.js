import api from '../api/axios';

export class ApiClient {
  async get(url, config) { const res = await api.get(url, config); return res.data; }
  async post(url, body, config) { const res = await api.post(url, body, config); return res.data; }
  async put(url, body, config) { const res = await api.put(url, body, config); return res.data; }
  async delete(url, config) { const res = await api.delete(url, config); return res.data; }
}
