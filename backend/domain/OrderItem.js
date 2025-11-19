class OrderItem {
  constructor({ idProducto, nombreProducto, cantidad, precioUnitario, subtotal, descripcion }) {
    this.productoId = idProducto;
    this.nombre = nombreProducto;
    this.descripcion = descripcion;
    this.cantidad = Number(cantidad);
    this.precioUnitario = Number(precioUnitario);
    this.subtotal = Number(subtotal ?? this.precioUnitario * this.cantidad);
  }
}

module.exports = { OrderItem };
