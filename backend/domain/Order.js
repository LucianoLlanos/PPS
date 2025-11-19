class Order {
  constructor({ idPedido, fechaPedido, estado, total, observaciones, productos = [] }) {
    this.id = idPedido;
    this.fecha = fechaPedido ? new Date(fechaPedido) : new Date();
    this.estado = estado || 'Pendiente';
    this.total = Number(total ?? 0);
    this.observaciones = observaciones || null;
    this.productos = productos;
  }
}

module.exports = { Order };
