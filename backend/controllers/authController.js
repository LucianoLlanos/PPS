const { connection } = require('../db/DB');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

const authController = {
  login: (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan credenciales' });
    console.log('[auth] login attempt for email:', email);
    connection.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
      if (err) {
        console.error('[auth] DB error:', err);
        return res.status(500).json({ error: 'Error en BD' });
      }
      if (!results || results.length === 0) {
        console.log('[auth] user not found for email:', email);
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      const user = results[0];
      // comparar password con bcrypt (si está hasheado) o con texto plano
      const match = bcrypt.compareSync(password, user.password);
      console.log(`[auth] password match for ${email}:`, Boolean(match));
      if (!match) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const payload = { idUsuario: user.idUsuario, idRol: user.idRol, email: user.email };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
      res.json({ token, user: payload });
    });
  },

  register: (req, res) => {
    const { nombre, apellido, email, password, idRol } = req.body;
    if (!nombre || !apellido || !email || !password || !idRol)
      return res.status(400).json({ error: 'Faltan datos' });
    // validar email único
    connection.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en BD' });
      if (results && results.length > 0) return res.status(409).json({ error: 'Email ya registrado' });
      const hashed = bcrypt.hashSync(password, 10);
      connection.query(
        'INSERT INTO usuarios (nombre, apellido, email, password, idRol) VALUES (?, ?, ?, ?, ?)',
        [nombre, apellido, email, hashed, idRol],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: 'Error al crear usuario' });
          res.json({ mensaje: 'Usuario creado', id: result.insertId });
        }
      );
    });
  },
};

module.exports = authController;
