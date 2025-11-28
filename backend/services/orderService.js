const { Database } = require('../core/database');
const { AppError } = require('../core/errors');
const { ClienteRepository } = require('../repositories/ClienteRepository');
const { OrderRepository } = require('../repositories/OrderRepository');
const { ProductRepository } = require('../repositories/ProductRepository');
const { StockAdminRepository } = require('../repositories/admin/StockAdminRepository');
const { Order } = require('../domain/Order');
const { OrderItem } = require('../domain/OrderItem');

class OrderService {
  constructor(db = new Database()) {
    this.db = db;
    this.clienteRepo = new ClienteRepository(db);
    this.orderRepo = new OrderRepository(db);
    this.productRepo = new ProductRepository(db);
    this.stockRepo = new StockAdminRepository(db);
    const { NotificationService } = require('./NotificationService');
    this.notif = new NotificationService(db);
  }

  validateProductos(productos) {
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      throw AppError.badRequest('Se requiere un array de productos');
    }
    for (const p of productos) {
      if (!p.idProducto || !p.cantidad || p.cantidad <= 0) {
        throw AppError.badRequest('Cada producto debe tener idProducto y cantidad válidos');
      }
    }
  }

  async createOrder(user, payload) {
    const { productos, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres, idSucursalOrigen } = payload;
    this.validateProductos(productos);

    const idUsuario = user.idUsuario;
    const idCliente = await this.clienteRepo.findIdByUsuarioId(idUsuario);
    if (!idCliente) throw AppError.notFound('No se encontró cliente asociado al usuario');

    return this.db.withTransaction(async (conn) => {
      const fechaPedido = new Date();

      const parsedCuotas = Number(cuotas) || 1;
      const parsedInteres = Number(interes) || 0;
      const parsedDescuento = Number(descuento) || 0;

      const idPedido = await this.orderRepo.insertPedido(conn, {
        idCliente,
        fechaPedido,
        observaciones,
        metodoPago,
        cuotas: parsedCuotas,
        interes: parsedInteres,
        descuento: parsedDescuento,
        totalConInteres,
        idSucursalOrigen: Number(idSucursalOrigen) || 1,
      });

      let acumulado = 0;
      for (const p of productos) {
        const basic = await this.productRepo.getBasicById(p.idProducto, conn);
        if (!basic) throw AppError.notFound(`Producto con ID ${p.idProducto} no encontrado`);

        const cantidad = Number(p.cantidad);
        if (isNaN(cantidad) || cantidad <= 0) throw AppError.badRequest(`Cantidad inválida para producto ${p.idProducto}`);

        // Preferir precioUnitario enviado en el payload (admin override). Si no viene, usar precio del producto.
        let precioUnitario = (p.precioUnitario !== undefined && p.precioUnitario !== null) ? Number(p.precioUnitario) : Number(basic.precio);
        if (isNaN(precioUnitario) || precioUnitario <= 0) {
          console.warn(`[OrderService] Precio unitario inválido para producto ${p.idProducto}:`, precioUnitario);
          throw AppError.badRequest(`Precio inválido para producto ${p.idProducto}`);
        }

        // Descontar stock en la sucursal seleccionada (si existe stock_sucursal suficiente)
        const suc = Number(idSucursalOrigen) || 1;
        const ok = await this.stockRepo.decrementStockIfAvailable({ idSucursal: suc, idProducto: p.idProducto, cantidad }, conn);
        if (!ok) {
          throw AppError.badRequest(`Stock insuficiente para producto ${p.idProducto} en la sucursal ${suc}`);
        }

        const subtotal = precioUnitario * cantidad;
        acumulado += subtotal;

        await this.orderRepo.insertDetalle(conn, {
          idPedido,
          idProducto: p.idProducto,
          cantidad,
          precioUnitario,
          subtotal,
        });
      }

      const totalFinal = totalConInteres || acumulado;
      await this.orderRepo.updateTotal(conn, { idPedido, total: totalFinal });

      // Crear notificación para administradores informando nuevo pedido
      try {
        const mensaje = `Nuevo pedido #${idPedido} - total $${Number(totalFinal || 0)}`;
        await this.notif.createNotification({ tipo: 'pedido', referenciaId: idPedido, mensaje, destinatarioRol: 'Administrador', metadata: { total: totalFinal } }, conn);
      } catch (e) {
        // No bloquear la transacción por fallas en notificaciones
        console.warn('[Notification] No se pudo crear notificación para pedido:', e && e.message ? e.message : e);
      }

      return { idPedido, total: totalFinal };
    });
  }

  async getMyOrders(user) {
    const rows = await this.orderRepo.getMyOrdersByUsuarioId(user.idUsuario);
    return rows.map((r) => ({
      idPedido: r.idPedido,
      fechaPedido: r.fechaPedido,
      estado: r.estado,
      total: Number(r.total ?? 0),
      totalConInteres: r.totalConInteres != null ? Number(r.totalConInteres) : null,
      metodoPago: r.metodoPago || null,
      cuotas: r.cuotas != null ? Number(r.cuotas) : null,
      interes: r.interes != null ? Number(r.interes) : null,
      descuento: r.descuento != null ? Number(r.descuento) : null,
      observaciones: r.observaciones,
      cantidadProductos: Number(r.cantidadProductos || 0),
    }));
  }

  async getMyOrderDetails(user, idPedido) {
    const rows = await this.orderRepo.getOrderDetailsByUsuarioId(user.idUsuario, idPedido);
    if (!rows || rows.length === 0) throw AppError.notFound('Pedido no encontrado');
    const productos = rows.map((r) => new OrderItem({
      nombreProducto: r.nombreProducto,
      descripcion: r.descripcion,
      cantidad: r.cantidad,
      precioUnitario: r.precioUnitario,
      subtotal: r.subtotal,
    }));
    return new Order({
      idPedido: rows[0].idPedido,
      fechaPedido: rows[0].fechaPedido,
      estado: rows[0].estado,
      total: rows[0].total,
      observaciones: rows[0].observaciones,
      productos,
    });
  }
}

module.exports = { OrderService };
