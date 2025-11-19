const { StockAdminService } = require('../../services/admin/StockAdminService');

class StockAdminController {
  constructor(service = new StockAdminService()) {
    this.service = service;
    this.listarStockSucursal = this.listarStockSucursal.bind(this);
    this.actualizarStockSucursal = this.actualizarStockSucursal.bind(this);
    this.backfillStockSucursales = this.backfillStockSucursales.bind(this);
    this.reconcileStockProducto = this.reconcileStockProducto.bind(this);
  }

  async listarStockSucursal(req, res) {
    try {
      const rows = await this.service.listarStockSucursal();
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Error al obtener stock por sucursal' });
    }
  }

  async actualizarStockSucursal(req, res) {
    try {
      const { idSucursal, idProducto } = req.params;
      const suc = Number(idSucursal);
      const prod = Number(idProducto);
      if (!suc || Number.isNaN(suc) || suc <= 0) return res.status(400).json({ error: 'idSucursal inválido' });
      if (!prod || Number.isNaN(prod) || prod <= 0) return res.status(400).json({ error: 'idProducto inválido' });
      const { stockDisponible } = req.body;
      if (stockDisponible === undefined || isNaN(Number(stockDisponible)) || Number(stockDisponible) < 0) {
        return res.status(400).json({ error: 'stockDisponible inválido' });
      }
      await this.service.actualizarStockSucursal(suc, prod, Number(stockDisponible));
      res.json({ mensaje: 'Stock actualizado', idSucursal: suc, idProducto: prod, stockDisponible: Number(stockDisponible) });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'Error al actualizar stock' });
    }
  }

  async backfillStockSucursales(req, res) {
    try {
      await this.service.backfillStockSucursales();
      res.json({ mensaje: 'Backfill completado' });
    } catch {
      res.status(500).json({ error: 'Error en backfill' });
    }
  }

  async reconcileStockProducto(req, res) {
    try {
      const { idProducto } = req.params;
      const prod = Number(idProducto);
      if (!prod || Number.isNaN(prod) || prod <= 0) return res.status(400).json({ error: 'idProducto inválido' });
      await this.service.reconcileStockProducto(prod);
      res.json({ mensaje: 'Stock reconciliado' });
    } catch (e) {
      if (e.status === 404) return res.status(404).json({ error: 'Producto no encontrado' });
      res.status(500).json({ error: 'Error al reconciliar stock' });
    }
  }
}

module.exports = new StockAdminController();