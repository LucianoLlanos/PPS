const { Database } = require('../../core/database');
const { AnalyticsRepository } = require('../../repositories/admin/AnalyticsRepository');

class AnalyticsAdminService {
  constructor(db = new Database()) {
    this.db = db;
    this.repo = new AnalyticsRepository(db);
  }

  async ventasSummary({ fechaDesde, fechaHasta, idSucursal }) {
    const end = fechaHasta || new Date().toISOString().slice(0, 10);
    const start = fechaDesde || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10); })();
    const r = await this.repo.ventasSummary({ start, end, idSucursal });
    const aov = (r.pedidos_entregados && Number(r.pedidos_entregados) > 0) ? (Number(r.ingresos_totales) / Number(r.pedidos_entregados)) : 0;
    return { pedidos: Number(r.pedidos_entregados || 0), ingresos: Number(r.ingresos_totales || 0), unidades: Number(r.unidades_vendidas || 0), aov: Number(aov) };
  }

  async ventasTimeseries({ fechaDesde, fechaHasta, idSucursal }) {
    const end = fechaHasta || new Date().toISOString().slice(0, 10);
    const start = fechaDesde || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10); })();
    const rows = await this.repo.ventasTimeseries({ start, end, idSucursal });
    return rows.map(r => ({ fecha: r.fecha, pedidos: Number(r.pedidos), ingresos: Number(r.ingresos), unidades: Number(r.unidades) }));
  }

  async ventasTopProducts({ fechaDesde, fechaHasta, limit, idSucursal }) {
    const end = fechaHasta || new Date().toISOString().slice(0, 10);
    const start = fechaDesde || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10); })();
    const lim = limit ? Number(limit) : 10;
    const rows = await this.repo.ventasTopProducts({ start, end, limit: lim, idSucursal });
    return rows.map(r => ({ idProducto: r.idProducto, nombre: r.nombre, cantidad: Number(r.cantidad), ingresos: Number(r.ingresos) }));
  }
}

module.exports = { AnalyticsAdminService };