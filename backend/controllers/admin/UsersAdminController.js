const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { UsersAdminService } = require('../../services/admin/UsersAdminService');

class UsersAdminController {
  constructor(service = new UsersAdminService()) {
    this.service = service;
    this.listarUsuarios = this.listarUsuarios.bind(this);
    this.crearUsuario = this.crearUsuario.bind(this);
    this.actualizarUsuario = this.actualizarUsuario.bind(this);
    this.eliminarUsuario = this.eliminarUsuario.bind(this);
  }

  async listarUsuarios(req, res) {
    try {
      const rows = await this.service.listarUsuarios();
      res.json(rows);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'Error al obtener usuarios' });
    }
  }

  async crearUsuario(req, res) {
    try {
      const schema = z.object({
        nombre: z.string().min(1),
        apellido: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        idRol: z.coerce.number().int().positive(),
        direccion: z.string().max(200).optional().nullable(),
        telefono: z.string().max(50).optional().nullable(),
      });
      const { nombre, apellido, email, password, idRol, direccion, telefono } = schema.parse(req.body);
      const hash = bcrypt.hashSync(password, 10);
      const id = await this.service.crearUsuario({ nombre, apellido, email, passwordHash: hash, idRol, direccion, telefono });
      res.json({ mensaje: 'Usuario creado', id });
    } catch (e) {
      if (e?.issues) return res.status(400).json({ error: 'Validación fallida', issues: e.issues });
      res.status(e.status || 500).json({ error: e.message || 'Error al crear usuario' });
    }
  }

  async actualizarUsuario(req, res) {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const schema = z.object({
        nombre: z.string().min(1),
        apellido: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6).optional(),
        idRol: z.coerce.number().int().positive(),
        direccion: z.string().max(200).optional().nullable(),
        telefono: z.string().max(50).optional().nullable(),
      });
      const { nombre, apellido, email, password, idRol, direccion, telefono } = schema.parse(req.body);
      const passwordHashOrNull = password ? bcrypt.hashSync(password, 10) : null;
      await this.service.actualizarUsuario(id, { nombre, apellido, email, passwordHashOrNull, idRol, direccion, telefono });
      res.json({ mensaje: 'Usuario actualizado' });
    } catch (e) {
      if (e?.issues) return res.status(400).json({ error: 'Validación fallida', issues: e.issues });
      res.status(e.status || 500).json({ error: e.message || 'Error al actualizar usuario' });
    }
  }

  async eliminarUsuario(req, res) {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      await this.service.eliminarUsuario(id);
      res.json({ mensaje: 'Usuario eliminado' });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'Error al eliminar usuario' });
    }
  }
}

module.exports = new UsersAdminController();