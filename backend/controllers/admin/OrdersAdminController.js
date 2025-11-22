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
      console.error('[OrdersAdminController][listarPedidos] error', arguments, new Error().stack);
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
      // Pass authenticated user so the service can decide whether to create notifications
      const actor = req.user || null;
      const result = await this.service.crearPedido({ idUsuarioCliente: idCliente, estado, idSucursalOrigen, productos, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres }, actor);
      res.json({ mensaje: 'Pedido creado', ...result });
    } catch (e) {
      if (e?.issues) return res.status(400).json({ error: 'Validación fallida', issues: e.issues });
      console.error('[OrdersAdminController][crearPedido] error', e && e.stack ? e.stack : e);
      res.status(e.status || 500).json({ error: e.message || 'Error al crear pedido' });
    }
  }

  async verDetallePedido(req, res) {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const rows = await this.service.verDetallePedido(id);
      res.json(rows);
    } catch {
      console.error('[OrdersAdminController][verDetallePedido] error', arguments, new Error().stack);
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
      const { estado: rawEstado } = z.object({ estado: z.string().min(1) }).parse(req.body);

      // Map frontend estado values to DB enum values (avoid MySQL truncation/errors)
      // DB enum uses lowercase values like: 'pendiente','confirmado','preparando','enviado','entregado','cancelado'
      const norm = String(rawEstado || '').trim().toLowerCase().replace(/[^a-záéíóúñ ]/g, '');
      const mapping = {
        'pendiente': 'pendiente',
        'confirmado': 'confirmado',
        'en proceso': 'preparando',
        'enproceso': 'preparando',
        'preparando': 'preparando',
        'enviado': 'enviado',
        'entregado': 'entregado',
        'cancelado': 'cancelado'
      };
      const estadoDb = mapping[norm];
      if (!estadoDb) {
        return res.status(400).json({ error: 'Estado inválido' });
      }

      await this.service.actualizarPedido(id, estadoDb);
      res.json({ mensaje: 'Pedido actualizado' });
    } catch (e) {
      console.error('[OrdersAdminController][actualizarPedido] error', e && (e.stack || e.message) ? (e.stack || e.message) : e);
      res.status(e.status || 500).json({ error: e.message || 'Error al actualizar pedido' });
    }
  }

  async crearRetiro(req, res) {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const body = req.body || {};
      const schema = z.object({ telefono: z.string().min(4).optional() });
      const { telefono } = schema.parse(body);

      const actor = req.user || null;
      const RetiroRepository = require('../../repositories/RetiroRepository');

      // Generar código de 6 dígitos y asegurar unicidad (hasta N intentos)
      const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();
      let codigo;
      let attempts = 0;
      while (attempts < 6) {
        codigo = genCode();
        // eslint-disable-next-line no-await-in-loop
        const exists = await RetiroRepository.getByCodigo(codigo);
        if (!exists) break;
        attempts += 1;
      }
      if (!codigo) return res.status(500).json({ error: 'No se pudo generar código de retiro' });

      const creado = await RetiroRepository.create({ idPedido: id, codigo, telefono: telefono || null, creadoPor: actor ? (actor.idUsuario || actor.id || null) : null });
      res.json({ mensaje: 'Código de retiro creado', codigo: creado.codigo || codigo, idRetiro: creado.idRetiro });
    } catch (e) {
      console.error('[OrdersAdminController][crearRetiro] error', e && (e.stack || e.message) ? (e.stack || e.message) : e);
      if (e?.issues) return res.status(400).json({ error: 'Validación fallida', issues: e.issues });
      res.status(e.status || 500).json({ error: e.message || 'Error al crear código de retiro' });
    }
  }
}

module.exports = new OrdersAdminController();