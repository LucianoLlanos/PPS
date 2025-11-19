import { ApiClient } from './ApiClient';

export class StockService {
  constructor(client = new ApiClient()) { this.client = client; }
  async listStockSucursal() { return this.client.get('/admin/stock_sucursal'); }
  async updateStockSucursal(idSucursal, idProducto, stockDisponible) {
    return this.client.put(`/admin/stock_sucursal/${idSucursal}/${idProducto}`, { stockDisponible });
  }
  async backfill() { return this.client.post('/admin/stock_sucursal/backfill'); }
  async reconcileProducto(idProducto) { return this.client.post(`/admin/productos/${idProducto}/reconcile`); }
}
