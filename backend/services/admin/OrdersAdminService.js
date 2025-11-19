const { Database } = require('../../core/database');
const { PedidoAdminRepository } = require('../../repositories/admin/PedidoAdminRepository');
const { StockAdminRepository } = require('../../repositories/admin/StockAdminRepository');

class OrdersAdminService {
  constructor(db = new Database()) {
    this.db = db;
    this.pedidoRepo = new PedidoAdminRepository(db);
    this.stockRepo = new StockAdminRepository(db);
  }

  async listarPedidos(filtros) {
    const {
      idPedido, estado, fechaDesde, fechaHasta, fecha, producto, usuario,
      totalMin, totalMax, cantidadMin, cantidadMax, priorizarPendientes, sort
    } = filtros;

    const where = [];
    const params = [];
    if (idPedido) { where.push('pe.idPedido = ?'); params.push(idPedido); }
    if (estado) { where.push('pe.estado = ?'); params.push(estado); }
    if (fecha) { where.push('DATE(COALESCE(pe.fechaPedido, pe.fecha)) = ?'); params.push(fecha); }
    else if (fechaDesde && fechaHasta) { where.push('DATE(COALESCE(pe.fechaPedido, pe.fecha)) BETWEEN ? AND ?'); params.push(fechaDesde, fechaHasta); }
    else {
      if (fechaDesde) { where.push('DATE(COALESCE(pe.fechaPedido, pe.fecha)) >= ?'); params.push(fechaDesde); }
      if (fechaHasta) { where.push('DATE(COALESCE(pe.fechaPedido, pe.fecha)) <= ?'); params.push(fechaHasta); }
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
        if (s === 'fecha_asc') orderClauses.push('COALESCE(pe.fechaPedido, pe.fecha) ASC');
        else if (s === 'fecha_desc') orderClauses.push('COALESCE(pe.fechaPedido, pe.fecha) DESC');
        else if (s === 'cantidad_asc') orderClauses.push('(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) ASC');
        else if (s === 'cantidad_desc') orderClauses.push('(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) DESC');
      });
    }
    const orderBySql = orderClauses.length ? orderClauses.join(', ') : 'COALESCE(pe.fechaPedido, pe.fecha) DESC';

    const pedidos = await this.pedidoRepo.selectPedidosWithFilters({ whereSql, params, orderBySql });
    if (!pedidos || pedidos.length === 0) return [];
    const ids = pedidos.map(p => p.idPedido);
    const detalles = await this.pedidoRepo.selectDetallesForPedidos(ids);
    return pedidos.map(p => ({
      ...p,
      productos: detalles
        .filter(d => d.idPedido === p.idPedido)
        .map(d => ({ nombre: d.nombreProducto, cantidad: d.cantidad, total: d.cantidad * d.precioUnitario }))
    }));
  }

  async crearPedido({ idUsuarioCliente, estado, idSucursalOrigen, productos, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres }) {
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

      const withPaymentCols = await this.pedidoRepo.hasPaymentColumns();
      const idPedido = await this.pedidoRepo.insertPedidoCore({ idCliente, estado, idSucursalOrigen, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres }, conn, withPaymentCols);

      let totalPedido = 0;
      let cantidadTotal = 0;
      for (const p of productos) {
        const precioUnit = Number(p.precioUnitario || p.precio || 0);
        const subtotal = precioUnit * Number(p.cantidad || 0);
        await this.pedidoRepo.insertDetalle({ idPedido, idProducto: p.idProducto, cantidad: p.cantidad, precioUnitario: precioUnit, subtotal }, conn);
        totalPedido += subtotal;
        cantidadTotal += Number(p.cantidad || 0);
        const ok = await this.stockRepo.decrementStockIfAvailable({ idSucursal: idSucursalOrigen, idProducto: p.idProducto, cantidad: p.cantidad }, conn);
        if (!ok) {
          const err = new Error(`Stock insuficiente para producto ${p.idProducto} en sucursal ${idSucursalOrigen}`);
          err.status = 400;
          throw err;
        }
        await this.stockRepo.incrementProductStockTotal(p.idProducto, -Number(p.cantidad || 0), conn);
      }

      const hasCantCol = await this.pedidoRepo.hasCantidadTotalColumn();
      await this.pedidoRepo.updatePedidoTotals(idPedido, { total: totalPedido, cantidadTotal }, conn, hasCantCol);

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