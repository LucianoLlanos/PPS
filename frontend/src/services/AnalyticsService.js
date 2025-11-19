import { ApiClient } from './ApiClient';

export class AnalyticsService {
  constructor(client = new ApiClient()) { this.client = client; }
  async summary(params) { const q = params ? ('?' + new URLSearchParams(params)) : ''; return this.client.get('/admin/ventas/summary' + q); }
  async timeseries(params) { const q = params ? ('?' + new URLSearchParams(params)) : ''; return this.client.get('/admin/ventas/timeseries' + q); }
  async topProducts(params) { const q = params ? ('?' + new URLSearchParams(params)) : ''; return this.client.get('/admin/ventas/top-products' + q); }
}
