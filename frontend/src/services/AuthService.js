import { ApiClient } from './ApiClient';

export class AuthService {
  constructor(client = new ApiClient()) { this.client = client; }
  async login(email, password) { return this.client.post('/auth/login', { email, password }); }
  async register(payload) { return this.client.post('/auth/register', payload); }
  async forgot(email) { return this.client.post('/auth/forgot', { email }); }
  async reset({ idUsuario, token, newPassword }) { return this.client.post('/auth/reset', { idUsuario, token, newPassword }); }
}
