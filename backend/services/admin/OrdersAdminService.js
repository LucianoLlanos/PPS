const { Database } = require('../../core/database');
const { PedidoAdminRepository } = require('../../repositories/admin/PedidoAdminRepository');
const { StockAdminRepository } = require('../../repositories/admin/StockAdminRepository');

class OrdersAdminService {
  constructor(db = new Database()) {
    this.db = db;
    this.pedidoRepo = new PedidoAdminRepository(db);
    this.stockRepo = new StockAdminRepository(db);
    const { NotificationService } = require('../NotificationService');
    this.notif = new NotificationService(db);
  }

  async listarPedidos(filtros) {
    let {
      idPedido, estado, fechaDesde, fechaHasta, fecha, producto, usuario,
      totalMin, totalMax, cantidadMin, cantidadMax, priorizarPendientes, sort
    } = filtros || {};

    // Detect if frontend explicitly provided the `estado` parameter
    const estadoProvided = Object.prototype.hasOwnProperty.call(filtros || {}, 'estado');

    // Normalize 'estado' so frontend values like 'Todos' do not act as a non-provided value.
    // If the frontend explicitly sent 'Todos' (or synonyms), treat it as a request to show all.
    let requestedAllEstado = false;
    if (typeof estado === 'string') {
      const low = estado.trim().toLowerCase();
      // remove non-letter characters so '(todos)' or similar variants match
      const cleaned = low.replace(/[^a-záéíóúñ]/g, '');
      if (cleaned === 'todos' || cleaned === 'todas' || cleaned === 'all' || cleaned === 'any') {
        // mark that the user requested all estados explicitly
        requestedAllEstado = true;
        estado = undefined; // remove as filter
      }
    }

    // Default behavior: when no filters provided and the user did not explicitly request 'Todos', show only 'Pendiente'.
    const hasAnyFilter = (
      idPedido || fecha || fechaDesde || fechaHasta || producto || usuario ||
      (typeof totalMin !== 'undefined' && totalMin !== '') || (typeof totalMax !== 'undefined' && totalMax !== '') ||
      (typeof cantidadMin !== 'undefined' && cantidadMin !== '') || (typeof cantidadMax !== 'undefined' && cantidadMax !== '')
    );
    // Determine the DB enum value to filter by (map UI values to DB values)
    let estadoDb = null;
    if (!estado && !hasAnyFilter && !requestedAllEstado && !estadoProvided) {
      estadoDb = 'pendiente';
    } else if (estado) {
      const normEstado = String(estado).trim().toLowerCase().replace(/[^a-záéíóúñ ]/g, '');
      const toDb = {
        'pendiente': 'pendiente',
        'confirmado': 'confirmado',
        'en proceso': 'preparando',
        'enproceso': 'preparando',
        'preparando': 'preparando',
        'enviado': 'enviado',
        'entregado': 'entregado',
        'cancelado': 'cancelado'
      };
      estadoDb = toDb[normEstado] || null;
    }

    const where = [];
    const params = [];
    if (idPedido) { where.push('pe.idPedido = ?'); params.push(idPedido); }
    if (estadoDb) { where.push('pe.estado = ?'); params.push(estadoDb); }
    if (fecha) { where.push('DATE(pe.fechaPedido) = ?'); params.push(fecha); }
    else if (fechaDesde && fechaHasta) { where.push('DATE(pe.fechaPedido) BETWEEN ? AND ?'); params.push(fechaDesde, fechaHasta); }
    else {
      if (fechaDesde) { where.push('DATE(pe.fechaPedido) >= ?'); params.push(fechaDesde); }
      if (fechaHasta) { where.push('DATE(pe.fechaPedido) <= ?'); params.push(fechaHasta); }
    }
    if (producto) { where.push(`EXISTS (SELECT 1 FROM detalle_pedidos dp JOIN productos pr ON dp.idProducto = pr.idProducto WHERE dp.idPedido = pe.idPedido AND pr.nombre LIKE ?)`); params.push('%'+producto+'%'); }
    if (usuario) { where.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)'); params.push('%'+usuario+'%','%'+usuario+'%','%'+usuario+'%'); }
    const tmin = (typeof totalMin !== 'undefined' && totalMin !== '') ? Number(totalMin) : undefined;
    const tmax = (typeof totalMax !== 'undefined' && totalMax !== '') ? Number(totalMax) : undefined;
    if (typeof tmin !== 'undefined' && !isNaN(tmin)) { where.push(`COALESCE(pe.total, (SELECT COALESCE(SUM(dp.cantidad * dp.precioUnitario),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido)) >= ?`); params.push(tmin); }
    if (typeof tmax !== 'undefined' && !isNaN(tmax)) { where.push(`COALESCE(pe.total, (SELECT COALESCE(SUM(dp.cantidad * dp.precioUnitario),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido)) <= ?`); params.push(tmax); }
    const cmin = (typeof cantidadMin !== 'undefined' && cantidadMin !== '') ? Number(cantidadMin) : undefined;
    const cmax = (typeof cantidadMax !== 'undefined' && cantidadMax !== '') ? Number(cantidadMax) : undefined;
    if (typeof cmin !== 'undefined' && !isNaN(cmin)) { where.push(`(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) >= ?`); params.push(cmin); }
    if (typeof cmax !== 'undefined' && !isNaN(cmax)) { where.push(`(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) <= ?`); params.push(cmax); }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const orderClauses = [];
    if (priorizarPendientes === '1') orderClauses.push("CASE WHEN pe.estado = 'Pendiente' THEN 0 ELSE 1 END");
    if (sort) {
      const parts = String(sort).split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(s => {
        if (s === 'fecha_asc') orderClauses.push('pe.fechaPedido ASC');
        else if (s === 'fecha_desc') orderClauses.push('pe.fechaPedido DESC');
        else if (s === 'cantidad_asc') orderClauses.push('(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) ASC');
        else if (s === 'cantidad_desc') orderClauses.push('(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) DESC');
      });
    }
    const orderBySql = orderClauses.length ? orderClauses.join(', ') : 'pe.fechaPedido DESC';

    const pedidos = await this.pedidoRepo.selectPedidosWithFilters({ whereSql, params, orderBySql });
    if (!pedidos || pedidos.length === 0) return [];
    // Attach retiro info (if any) for each pedido
    const RetiroRepository = require('../../repositories/RetiroRepository');
    const ids = pedidos.map(p => p.idPedido);
    const detalles = await this.pedidoRepo.selectDetallesForPedidos(ids);
    // Map DB estado values to display labels expected by the frontend
    const estadoDisplay = {
      'pendiente': 'Pendiente',
      'confirmado': 'Confirmado',
      'preparando': 'En Proceso',
      'enviado': 'Enviado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    // Fetch retiros for all pedidos in one pass
    const retirosMap = {};
    try {
      // RetiroRepository.getByPedido returns a row or null
      for (const id of ids) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const r = await RetiroRepository.getByPedido(id);
          if (r) {
            // Map DB timestamp 'creadoEn' to a JS-friendly 'createdAt' property
            const mapped = Object.assign({}, r);
            if (!mapped.createdAt && mapped.creadoEn) mapped.createdAt = mapped.creadoEn;
            retirosMap[id] = mapped;
          }
        } catch (e) {
          // ignore per-pedido retiro errors
          console.warn('Could not fetch retiro for pedido', id, e && e.message ? e.message : e);
        }
      }
    } catch (e) {
      // ignore overall retiro fetching errors
      console.warn('Error fetching retiros for pedidos', e && e.message ? e.message : e);
    }

    return pedidos.map(p => ({
      ...p,
      estado: estadoDisplay[String(p.estado || '').toLowerCase()] || p.estado,
      productos: detalles
        .filter(d => d.idPedido === p.idPedido)
        .map(d => ({
          nombre: d.nombreProducto,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          total: Number(d.cantidad) * Number(d.precioUnitario)
        })),
      retiro: retirosMap[p.idPedido] || null
    }));
  }

  async crearPedido({ idUsuarioCliente, estado, idSucursalOrigen, productos, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres }, actor = null) {
    return this.db.withTransaction(async (conn) => {
      const [rolRes] = await conn.query('SELECT r.nombreRol FROM usuarios u JOIN roles r ON u.idRol = r.idRol WHERE u.idUsuario=?', [idUsuarioCliente]);
      if (!rolRes || !rolRes.length || String(rolRes[0].nombreRol || '').toLowerCase() !== 'cliente') {
        const err = new Error('Solo usuarios con rol Cliente pueden registrar pedidos');
        err.status = 403;
        throw err;
      }
      let idCliente;
      const [cliRows] = await conn.query('SELECT idCliente FROM clientes WHERE idUsuario=?', [idUsuarioCliente]);
      if (cliRows && cliRows.length) idCliente = cliRows[0].idCliente;
      else {
        const [ins] = await conn.query('INSERT INTO clientes (idUsuario) VALUES (?)', [idUsuarioCliente]);
        idCliente = ins.insertId;
      }

      // Calculate total and cantidadTotal using canonical prices from DB (do not trust frontend)
      if (!Array.isArray(productos) || productos.length === 0) {
        const err = new Error('Debe enviar al menos un producto en el pedido');
        err.status = 400;
        throw err;
      }

      const prodIds = [...new Set(productos.map(p => Number(p.idProducto)).filter(Boolean))];
      if (prodIds.length === 0) {
        const err = new Error('Productos inválidos en el pedido');
        err.status = 400;
        throw err;
      }

      // Fetch canonical prices from productos table
      const placeholders = prodIds.map(() => '?').join(',');
      const [priceRows] = await conn.query(`SELECT idProducto, precio FROM productos WHERE idProducto IN (${placeholders})`, prodIds);
      const priceMap = new Map((priceRows || []).map(r => [Number(r.idProducto), Number(r.precio || 0)]));

      let totalPedido = 0;
      let cantidadTotal = 0;
      // Validate and compute totals
      for (const p of productos) {
        const idProducto = Number(p.idProducto);
        const cantidad = Number(p.cantidad || 0);
        if (!idProducto || cantidad <= 0) {
          const err = new Error(`Producto inválido o cantidad no válida: ${JSON.stringify(p)}`);
          err.status = 400;
          throw err;
        }
        const precioUnitario = priceMap.get(idProducto);
        if (typeof precioUnitario === 'undefined') {
          const err = new Error(`Producto no encontrado: ${idProducto}`);
          err.status = 400;
          throw err;
        }
        const subtotal = precioUnitario * cantidad;
        totalPedido += subtotal;
        cantidadTotal += cantidad;
      }

      // Force use of payment columns insertion when creating from admin/seller flows
      const idPedido = await this.pedidoRepo.insertPedidoCore({ idCliente, estado, idSucursalOrigen, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres, total: totalPedido }, conn, true);

      // Insert detalles and update stock using canonical prices
      for (const p of productos) {
        const idProducto = Number(p.idProducto);
        const cantidad = Number(p.cantidad || 0);
        const precioUnitario = priceMap.get(idProducto);
        const subtotal = precioUnitario * cantidad;
        await this.pedidoRepo.insertDetalle({ idPedido, idProducto, cantidad, precioUnitario, subtotal }, conn);
        const ok = await this.stockRepo.decrementStockIfAvailable({ idSucursal: idSucursalOrigen, idProducto, cantidad }, conn);
        if (!ok) {
          const err = new Error(`Stock insuficiente para producto ${idProducto} en sucursal ${idSucursalOrigen}`);
          err.status = 400;
          throw err;
        }
        await this.stockRepo.incrementProductStockTotal(idProducto, -cantidad, conn);
        // Recalculate product total from stock_sucursal to ensure consistency (defensive)
        try {
          await this.stockRepo.recalcProductTotalFromSucursal(idProducto, conn);
        } catch (e) {
          // best-effort: log and continue
          console.warn('[OrdersAdminService] could not recalc product total for', idProducto, e && e.message ? e.message : e);
        }
      }

      const hasCantCol = await this.pedidoRepo.hasCantidadTotalColumn();
      await this.pedidoRepo.updatePedidoTotals(idPedido, { total: totalPedido, cantidadTotal }, conn, hasCantCol);

      // Crear notificación sólo si el actor no es un administrador (rol 3).
      // Esto permite que vendedores (rol 2) que usan el endpoint admin reciban notificación,
      // mientras que acciones hechas por administradores desde el panel no generen duplicados.
      try {
        const actorRole = actor && actor.idRol ? Number(actor.idRol) : null;
        if (actorRole !== 3) {
          const mensaje = `Nuevo pedido #${idPedido} - total $${Number(totalPedido || 0)}`;
          await this.notif.createNotification({ tipo: 'pedido', referenciaId: idPedido, mensaje, destinatarioRol: 'Administrador', metadata: { total: totalPedido } }, conn);
        }
      } catch (e) {
        console.warn('[OrdersAdminService] notificación no creada:', e && e.message ? e.message : e);
      }

      return { idPedido, total: totalPedido, cantidadTotal };
    });
  }

  async verDetallePedido(idPedido) {
    const sql = `SELECT dp.idPedido, dp.idProducto, p.nombre AS nombreProducto, dp.cantidad, dp.precioUnitario
                 FROM detalle_pedidos dp JOIN productos p ON dp.idProducto = p.idProducto
                 WHERE dp.idPedido = ?`;
    return this.db.query(sql, [idPedido]);
  }

  async eliminarPedido(idPedido) {
    return this.db.withTransaction(async (conn) => {
      const pedido = await this.pedidoRepo.getPedidoById(idPedido, conn);
      if (!pedido) {
        const err = new Error('Pedido no encontrado');
        err.status = 404;
        throw err;
      }
      const idSucursalOrigen = pedido.idSucursalOrigen;
      const detalles = await this.pedidoRepo.getDetallesByPedido(idPedido, conn);
      for (const d of detalles) {
        await this.stockRepo.incrementProductStockTotal(d.idProducto, Number(d.cantidad || 0), conn);
        const actual = await this.stockRepo.getStockEntry(idSucursalOrigen, d.idProducto, conn);
        const nuevo = Number(actual || 0) + Number(d.cantidad || 0);
        await this.stockRepo.updateStockEntry(idSucursalOrigen, d.idProducto, nuevo, conn);
      }
      await this.pedidoRepo.deleteDetallesByPedido(idPedido, conn);
      await this.pedidoRepo.deletePedido(idPedido, conn);
    });
  }

  async actualizarPedido(idPedido, estado) {
    await this.pedidoRepo.updateEstado(idPedido, estado);
    if (String(estado).toLowerCase() === 'entregado') {
      await this.pedidoRepo.setFechaEntregaNowIfColumnExists(idPedido);
    }
  }
}

module.exports = { OrdersAdminService };