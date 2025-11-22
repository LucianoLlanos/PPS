import { ApiClient } from './ApiClient';

export class StockService {
  constructor(client = new ApiClient()) { this.client = client; }
  async listStockSucursal() { return this.client.get('/admin/stock_sucursal'); }
  async updateStockSucursal(idSucursal, idProducto, stockDisponible) {
    return this.client.put(`/admin/stock_sucursal/${idSucursal}/${idProducto}`, { stockDisponible });
  }
  async backfill() { return this.client.post('/admin/stock_sucursal/backfill'); }
  async reconcileProducto(idProducto) { return this.client.post(`/admin/productos/${idProducto}/reconcile`); }
  async listMovements(idProducto, limit = 100) { return this.client.get('/admin/stock/movimientos', { params: { idProducto, limit } }); }
  async transferStock(payload) { return this.client.post('/admin/stock/transfer', payload); }
}
