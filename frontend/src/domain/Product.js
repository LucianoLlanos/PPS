export class Product {
  constructor({ idProducto, nombre, descripcion, precio, stock, imagen, imagenes = [] }) {
    this.idProducto = Number(idProducto);
    this.nombre = nombre || '';
    this.descripcion = descripcion || '';
    this.precio = Number(precio || 0);
    this.stock = Number(stock || 0);
    this.imagen = imagen || null;
    this.imagenes = Array.isArray(imagenes) ? imagenes : (typeof imagenes === 'string' ? imagenes.split(',') : []);
  }
}
