export class Sucursal {
  constructor({ idSucursal, nombre, direccion }) {
    this.idSucursal = Number(idSucursal);
    this.nombre = nombre || '';
    this.direccion = direccion || '';
  }
}
