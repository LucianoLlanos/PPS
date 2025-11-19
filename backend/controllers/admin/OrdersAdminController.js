const { OrdersAdminService } = require('../../services/admin/OrdersAdminService');
const { z } = require('zod');

class OrdersAdminController {
  constructor(service = new OrdersAdminService()) {
    this.service = service;
    this.listarPedidos = this.listarPedidos.bind(this);
    this.crearPedido = this.crearPedido.bind(this);
    this.verDetallePedido = this.verDetallePedido.bind(this);
    this.eliminarPedido = this.eliminarPedido.bind(this);
    this.actualizarPedido = this.actualizarPedido.bind(this);
  }

  async listarPedidos(req, res) {
    try {
      const data = await this.service.listarPedidos(req.query);
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Error al obtener pedidos' });
    }
  }

  async crearPedido(req, res) {
    try {
      const schema = z.object({
        idCliente: z.coerce.number().int().positive(),
        estado: z.string().min(1),
        idSucursalOrigen: z.coerce.number().int().positive(),
        productos: z.preprocess((v) => (typeof v === 'string' ? (()=>{ try { return JSON.parse(v); } catch { return []; } })() : v),
                   z.array(z.object({
                     idProducto: z.coerce.number().int().positive(),
                     cantidad: z.coerce.number().int().positive(),
                     precioUnitario: z.coerce.number().positive().optional()
                   })).min(1)),
        observaciones: z.string().max(500).optional().nullable(),
        metodoPago: z.string().optional().nullable(),
        cuotas: z.coerce.number().int().positive().optional().nullable(),
        interes: z.coerce.number().nonnegative().optional().nullable(),
        descuento: z.coerce.number().nonnegative().optional().nullable(),
        totalConInteres: z.coerce.number().nonnegative().optional().nullable(),
      });
      const { idCliente, estado, idSucursalOrigen, productos, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres } = schema.parse(req.body);
      const result = await this.service.crearPedido({ idUsuarioCliente: idCliente, estado, idSucursalOrigen, productos, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres });
      res.json({ mensaje: 'Pedido creado', ...result });
    } catch (e) {
      if (e?.issues) return res.status(400).json({ error: 'Validación fallida', issues: e.issues });
      res.status(e.status || 500).json({ error: e.message || 'Error al crear pedido' });
    }
  }

  async verDetallePedido(req, res) {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const rows = await this.service.verDetallePedido(id);
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Error al obtener detalle del pedido' });
    }
  }

  async eliminarPedido(req, res) {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      await this.service.eliminarPedido(id);
      res.json({ mensaje: 'Pedido eliminado y stock restaurado' });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'Error al eliminar pedido' });
    }
  }

  async actualizarPedido(req, res) {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const { estado } = z.object({ estado: z.string().min(1) }).parse(req.body);
      await this.service.actualizarPedido(id, estado);
      res.json({ mensaje: 'Pedido actualizado' });
    } catch {
      res.status(500).json({ error: 'Error al actualizar pedido' });
    }
  }
}

module.exports = new OrdersAdminController();