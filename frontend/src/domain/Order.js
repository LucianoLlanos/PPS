import { OrderItem } from './OrderItem';

export class Order {
  constructor({ idPedido, productos = [], nombreUsuario, apellidoUsuario, fecha, estado, metodoPago, cuotas, interes, descuento, total, totalConInteres }) {
    this.idPedido = Number(idPedido);
    this.productos = Array.isArray(productos) ? productos.map(p => new OrderItem(p)) : [];
    this.nombreUsuario = nombreUsuario || '';
    this.apellidoUsuario = apellidoUsuario || '';
    this.fecha = fecha ? new Date(fecha) : new Date();
    this.estado = estado || 'Pendiente';
    this.metodoPago = metodoPago || null;
    this.cuotas = cuotas != null ? Number(cuotas) : null;
    this.interes = interes != null ? Number(interes) : null;
    this.descuento = descuento != null ? Number(descuento) : null;
    this.total = Number(total || 0);
    this.totalConInteres = totalConInteres != null ? Number(totalConInteres) : null;
  }
}
