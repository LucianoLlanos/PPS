class Product {
  constructor({ idProducto, nombre, descripcion, precio, stock, imagen, imagenes = [] }) {
    this.id = idProducto;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = Number(precio);
    this.stock = Number(stock ?? 0);
    this.imagen = imagen || null;
    this.imagenes = imagenes;
  }
}

module.exports = { Product };
