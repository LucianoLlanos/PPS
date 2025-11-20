class Product {
  constructor({ idProducto, nombre, tipo, descripcion, precio, stock, imagen, imagenes = [] }) {
    this.id = idProducto;
    this.idProducto = idProducto;
    this.nombre = nombre;
    this.tipo = tipo || null;
    this.descripcion = descripcion;
    this.precio = Number(precio);
    this.stock = Number(stock ?? 0);
    this.imagen = imagen || null;
    this.imagenes = imagenes;
  }
}

module.exports = { Product };
