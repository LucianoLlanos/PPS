import { ApiClient } from './ApiClient';

export class OrdersClientService {
  constructor(client = new ApiClient()) { this.client = client; }
  async create(payload) { return this.client.post('/orders/create', payload); }
}
