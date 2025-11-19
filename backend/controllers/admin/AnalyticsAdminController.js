const { AnalyticsAdminService } = require('../../services/admin/AnalyticsAdminService');

class AnalyticsAdminController {
  constructor(service = new AnalyticsAdminService()) {
    this.service = service;
    this.ventasSummary = this.ventasSummary.bind(this);
    this.ventasTimeseries = this.ventasTimeseries.bind(this);
    this.ventasTopProducts = this.ventasTopProducts.bind(this);
  }

  async ventasSummary(req, res) {
    try {
      const data = await this.service.ventasSummary(req.query);
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Error al calcular resumen de ventas' });
    }
  }

  async ventasTimeseries(req, res) {
    try {
      const data = await this.service.ventasTimeseries(req.query);
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Error al calcular series temporales de ventas' });
    }
  }

  async ventasTopProducts(req, res) {
    try {
      const data = await this.service.ventasTopProducts(req.query);
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Error al obtener top de productos' });
    }
  }
}

module.exports = new AnalyticsAdminController();