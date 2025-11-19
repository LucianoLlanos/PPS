const { Database } = require('../../core/database');
const { UsuarioAdminRepository } = require('../../repositories/admin/UsuarioAdminRepository');
const { HistorialRepository } = require('../../repositories/admin/HistorialRepository');

class UsersAdminService {
  constructor(db = new Database()) {
    this.db = db;
    this.usuarioRepo = new UsuarioAdminRepository(db);
    this.historialRepo = new HistorialRepository(db);
  }

  async listarUsuarios() {
    return this.usuarioRepo.findAllWithRolYCliente();
  }

  async crearUsuario({ nombre, apellido, email, passwordHash, idRol, direccion, telefono }) {
    return this.db.withTransaction(async (conn) => {
      const exists = await this.usuarioRepo.existsEmail(email, conn);
      if (exists) {
        const err = new Error('El email ya está registrado');
        err.status = 409;
        throw err;
      }
      const idUsuario = await this.usuarioRepo.insertUser({ nombre, apellido, email, password: passwordHash, idRol }, conn);
      if (Number(idRol) === 1) {
        await this.usuarioRepo.insertClienteForUsuario(idUsuario, { direccion: direccion || null, telefono: telefono || null }, conn);
      }
      await this.historialRepo.insert('usuarios', idUsuario, 'crear', email, `Usuario${Number(idRol) === 1 ? ' cliente' : ''} creado: ${nombre} ${apellido}`, conn);
      return idUsuario;
    });
  }

  async actualizarUsuario(id, { nombre, apellido, email, passwordHashOrNull, idRol, direccion, telefono }) {
    return this.db.withTransaction(async (conn) => {
      const current = await this.usuarioRepo.findById(id, conn);
      if (!current) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
      }
      const passToUse = passwordHashOrNull ? passwordHashOrNull : current.password;
      await this.usuarioRepo.updateUser(id, { nombre, apellido, email, password: passToUse, idRol }, conn);
      if (Number(idRol) === 1) {
        const existsCliente = await this.usuarioRepo.clienteExistsForUsuario(id, conn);
        if (existsCliente) {
          await this.usuarioRepo.updateClienteByUsuario(id, { direccion: direccion || null, telefono: telefono || null }, conn);
        } else {
          await this.usuarioRepo.insertClienteByUsuario(id, { direccion: direccion || null, telefono: telefono || null }, conn);
        }
      }
      await this.historialRepo.insert('usuarios', id, 'actualizar', email, `Usuario${Number(idRol) === 1 ? ' cliente' : ''} actualizado: ${nombre} ${apellido}`, conn);
    });
  }

  async eliminarUsuario(id) {
    return this.db.withTransaction(async (conn) => {
      const user = await this.usuarioRepo.findById(id, conn);
      if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
      }
      const email = user.email;
      await this.usuarioRepo.deleteUser(id, conn);
      await this.historialRepo.insert('usuarios', id, 'eliminar', email, 'Usuario eliminado', conn);
    });
  }
}

module.exports = { UsersAdminService };