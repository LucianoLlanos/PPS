const { Database } = require('../core/database');
const { AppError } = require('../core/errors');
const { UserRepository } = require('../repositories/UserRepository');
const { ClienteRepository } = require('../repositories/ClienteRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor(db = new Database(), jwtSecret = process.env.JWT_SECRET || 'change_this_secret') {
    this.db = db;
    this.userRepo = new UserRepository(db);
    this.clienteRepo = new ClienteRepository(db);
    this.jwtSecret = jwtSecret;
  }

  async login({ email, password }) {
    if (!email || !password) throw AppError.badRequest('Faltan credenciales');
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw AppError.unauthorized('Credenciales inválidas');
    const stored = user.password || '';
    const looksHashed = typeof stored === 'string' && (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$'));
    let match = false;
    if (looksHashed) {
      match = bcrypt.compareSync(password, stored);
    } else {
      match = password === stored;
      if (match) {
        try {
          const newHash = bcrypt.hashSync(password, 10);
          // Migrate hash in the background (best-effort):
          const conn = await this.db.getConnection();
          try {
            await conn.query('UPDATE usuarios SET password = ? WHERE idUsuario = ?', [newHash, user.idUsuario]);
          } finally {
            conn.release();
          }
          user.password = newHash;
        } catch (_) {}
      }
    }
    if (!match) throw AppError.unauthorized('Credenciales inválidas');

    const payload = { idUsuario: user.idUsuario, idRol: user.idRol, email: user.email };
    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: '8h' });
    return { token, user: payload };
  }

  async register({ nombre, apellido, email, password, telefono }) {
    if (!nombre || !apellido || !email || !password) throw AppError.badRequest('Faltan datos obligatorios');
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new AppError('Email ya registrado', 409, 'CONFLICT');
    const roleId = 1;
    const hashed = bcrypt.hashSync(password, 10);

    return this.db.withTransaction(async (conn) => {
      const idUsuario = await this.userRepo.createUser(conn, { nombre, apellido, email, password: hashed, idRol: roleId });
      if (Number(roleId) === 1) {
        await conn.query('INSERT INTO clientes (idUsuario, telefono) VALUES (?, ?)', [idUsuario, telefono || null]);
      }
      return { mensaje: 'Usuario creado correctamente', id: idUsuario };
    });
  }
}

module.exports = { AuthService };
