export class Product {
  constructor(obj = {}) {
    const {
      idProducto,
      id,
      producto_id,
      productoId,
      nombre,
      tipo,
      descripcion,
      precio,
      price,
      stock,
      stockTotal,
      imagen,
      imagenes = []
    } = obj || {};

    // Aceptar múltiples variantes para el ID
    const rawId = idProducto ?? id ?? producto_id ?? productoId;
    const parsedId = Number(rawId);
    this.idProducto = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
    // Exponer también id para código que espera 'id'
    this.id = this.idProducto;

    this.nombre = nombre || obj.name || '';
    this.tipo = tipo || obj.categoria || null;
    this.descripcion = descripcion || obj.description || '';
    const rawPrecio = precio ?? price;
    this.precio = Number(rawPrecio || 0);
    // Mantener también price para compatibilidad
    this.price = this.precio;
    this.stock = Number(stock ?? stockTotal ?? obj.stockDisponible ?? 0);
    this.imagen = imagen || null;
    this.imagenes = Array.isArray(imagenes)
      ? imagenes
      : (typeof imagenes === 'string' && imagenes.length
          ? imagenes.split(',').map(s => s.trim()).filter(Boolean)
          : []);
  }

  toPlain() {
    return {
      idProducto: this.idProducto,
      id: this.id,
      nombre: this.nombre,
      tipo: this.tipo,
      descripcion: this.descripcion,
      precio: this.precio,
      price: this.price,
      stock: this.stock,
      imagen: this.imagen,
      imagenes: this.imagenes
    };
  }
}
