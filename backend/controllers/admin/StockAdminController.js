const { StockAdminService } = require('../../services/admin/StockAdminService');

class StockAdminController {
  constructor(service = new StockAdminService()) {
    this.service = service;
    this.listarStockSucursal = this.listarStockSucursal.bind(this);
    this.actualizarStockSucursal = this.actualizarStockSucursal.bind(this);
    this.backfillStockSucursales = this.backfillStockSucursales.bind(this);
    this.reconcileStockProducto = this.reconcileStockProducto.bind(this);
    this.reconcileAll = this.reconcileAll.bind(this);
    this.transferStock = this.transferStock.bind(this);
    this.adjustStock = this.adjustStock.bind(this);
    this.listMovimientos = this.listMovimientos.bind(this);
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
      // Log incoming body for debugging invalid payloads (helpful when frontend sends unexpected values)
      try { console.debug('[StockAdminController] actualizarStockSucursal body:', req.body); } catch (e) {}
      const { stockDisponible } = req.body;
      const parsedStock = Number(stockDisponible);
      if (stockDisponible === undefined || Number.isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ error: 'stockDisponible inválido' });
      }
      await this.service.actualizarStockSucursal(suc, prod, parsedStock);
      res.json({ mensaje: 'Stock actualizado', idSucursal: suc, idProducto: prod, stockDisponible: Number(stockDisponible) });
    } catch (e) {
      // Log full error for server-side debugging
      console.error('[StockAdminController][actualizarStockSucursal] error', e && (e.stack || e.message) ? (e.stack || e.message) : e);
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

  async reconcileAll(req, res) {
    try {
      await this.service.reconcileAllProducts();
      res.json({ mensaje: 'Reconciliación global completada' });
    } catch (e) {
      res.status(500).json({ error: 'Error al reconciliar todo el stock' });
    }
  }

  async transferStock(req, res) {
    try {
      const { idProducto, fromSucursal, toSucursal, cantidad, nota } = req.body || {};
      const uid = req.user ? req.user.idUsuario : null;
      await this.service.transferStock({ idProducto: Number(idProducto), fromSucursal: Number(fromSucursal), toSucursal: Number(toSucursal), cantidad: Number(cantidad), idUsuario: uid, nota: nota || null });
      res.json({ mensaje: 'Transferencia realizada' });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'Error en transferencia' });
    }
  }

  async adjustStock(req, res) {
    try {
      const { idProducto, idSucursal, nuevoStock, nota } = req.body || {};
      const uid = req.user ? req.user.idUsuario : null;
      await this.service.adjustStock({ idProducto: Number(idProducto), idSucursal: Number(idSucursal), nuevoStock: Number(nuevoStock), idUsuario: uid, nota: nota || null });
      res.json({ mensaje: 'Ajuste de stock aplicado' });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'Error en ajuste' });
    }
  }

  async listMovimientos(req, res) {
    try {
      const idProducto = req.query && req.query.idProducto ? Number(req.query.idProducto) : null;
      const limit = req.query && req.query.limit ? Number(req.query.limit) : 100;
      if (!idProducto) return res.status(400).json({ error: 'idProducto requerido' });
      const rows = await this.service.listMovementsForProduct(Number(idProducto), Number(limit));
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'Error al obtener movimientos' });
    }
  }
}

module.exports = new StockAdminController();