const { OrderService } = require('../services/orderService');
const { AppError } = require('../core/errors');

class OrdersController {
  constructor(service = new OrderService()) {
    this.service = service;
    this.createOrder = this.createOrder.bind(this);
    this.getMyOrders = this.getMyOrders.bind(this);
    this.getMyOrderDetails = this.getMyOrderDetails.bind(this);
  }

  async createOrder(req, res) {
    try {
      const result = await this.service.createOrder(req.user, req.body);
      res.status(201).json({ message: 'Pedido creado exitosamente', ...result });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      console.error(' Error creando pedido:', err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }

  async getMyOrders(req, res) {
    try {
      const data = await this.service.getMyOrders(req.user);
      res.json(data);
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      console.error(' Error obteniendo pedidos:', err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }

  async getMyOrderDetails(req, res) {
    try {
      const pedido = await this.service.getMyOrderDetails(req.user, req.params.id);
      res.json(pedido);
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      console.error(' Error obteniendo detalle del pedido:', err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }
}

module.exports = new OrdersController();