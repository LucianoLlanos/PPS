export class OrderItem {
  constructor({ idProducto, nombre, cantidad, precioUnitario }) {
    this.idProducto = Number(idProducto);
    this.nombre = nombre || '';
    this.cantidad = Number(cantidad || 0);
    this.precioUnitario = Number(precioUnitario || 0);
  }
}
