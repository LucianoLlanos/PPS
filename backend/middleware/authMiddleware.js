const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const { Database } = require('../core/database');

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Validate tokenVersion against DB to support invalidation on password reset
    const db = new Database();
    try {
      const rows = await db.query('SELECT tokenVersion, idRol, email, nombre, apellido FROM usuarios WHERE idUsuario = ?', [payload.idUsuario]);
      if (!rows || rows.length === 0) return res.status(401).json({ error: 'Token inválido' });
      const userRow = rows[0];
      const currentTokenVersion = Number(userRow.tokenVersion || 0);
      const tokenVersionInPayload = Number(payload.tokenVersion || 0);
      if (currentTokenVersion !== tokenVersionInPayload) return res.status(401).json({ error: 'Token inválido (sesión revocada)' });
      // attach user info for downstream handlers
      req.user = { idUsuario: payload.idUsuario, idRol: payload.idRol, email: userRow.email, nombre: userRow.nombre, apellido: userRow.apellido };
      return next();
    } catch (e) {
      console.error('authMiddleware db error', e);
      return res.status(500).json({ error: 'Error interno' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = authMiddleware;
