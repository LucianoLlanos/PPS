export class User {
  constructor({ idUsuario, nombre, apellido, email, idRol }) {
    this.idUsuario = Number(idUsuario);
    this.nombre = nombre || '';
    this.apellido = apellido || '';
    this.email = email || '';
    this.idRol = Number(idRol || 1);
  }
}
