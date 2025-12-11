const { Database } = require('../core/database');
const { AppError } = require('../core/errors');
const { UserRepository } = require('../repositories/UserRepository');
const { ClienteRepository } = require('../repositories/ClienteRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { PasswordResetRepository } = require('../repositories/PasswordResetRepository');

// Optional SendGrid usage: if SENDGRID_API_KEY is set, we'll use @sendgrid/mail
let sendgrid = null;
if (process.env.SENDGRID_API_KEY) {
  try {
    sendgrid = require('@sendgrid/mail');
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (e) {
    console.warn('SendGrid library not installed; falling back to SMTP transport');
    sendgrid = null;
  }
}

class AuthService {
  constructor(db = new Database(), jwtSecret = process.env.JWT_SECRET || 'change_this_secret') {
    this.db = db;
    this.userRepo = new UserRepository(db);
    this.clienteRepo = new ClienteRepository(db);
    this.jwtSecret = jwtSecret;
    this.passwordResetRepo = new PasswordResetRepository(db);
    // Nodemailer transport config (use env vars)
    this.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }

  // Validate mail configuration when using SendGrid
  validateMailConfig() {
    if (process.env.SENDGRID_API_KEY && !process.env.SENDGRID_FROM) {
      console.warn('[WARN][AuthService] SENDGRID_API_KEY is set but SENDGRID_FROM is missing. Set SENDGRID_FROM to a verified sender.');
    }
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

    // Include tokenVersion so we can invalidate previously issued tokens if tokenVersion increments
    const payload = { idUsuario: user.idUsuario, idRol: user.idRol, email: user.email, tokenVersion: user.tokenVersion || 0 };
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

  // ---------------- Password reset flow ----------------
  async requestPasswordReset(email, ipRequest = null, userAgent = null) {
    if (!email) return; // silently ignore
    const user = await this.userRepo.findByEmail(email);
    if (!user) return; // do not reveal

    // Rate-limit per user: max N requests per window
    try {
      const recent = await this.passwordResetRepo.countRecentByUsuario(user.idUsuario, Number(process.env.RESET_WINDOW_MINUTES || 60));
      const maxPerWindow = Number(process.env.RESET_MAX_PER_WINDOW || 5);
      if (recent >= maxPerWindow) {
        // Log and silently return (do not reveal to client whether email exists)
        console.warn(`Password reset rate limit reached for user ${user.idUsuario} (${recent} reqs)`);
        return;
      }
    } catch (e) {
      console.error('Error checking password reset rate', e);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + ((Number(process.env.RESET_WINDOW_MINUTES) || 60) * 60 * 1000)); // default 1 hour

    await this.passwordResetRepo.create({ idUsuario: user.idUsuario, tokenHash, expiresAt, ipRequest, userAgent });

    // send email with token (plain token, not hash), using template
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
    const resetLink = `${baseUrl}/reset-password?uid=${user.idUsuario}&token=${encodeURIComponent(token)}`;
    const { resetPasswordEmail } = require('../utils/emailTemplates');
    const html = resetPasswordEmail(user.nombre || user.email || 'Usuario', resetLink, `${Number(process.env.RESET_WINDOW_MINUTES || 60)} minutos`);
    const subject = 'Recuperación de contraseña';
    const text = `Solicitaste restablecer tu contraseña. Copia la URL: ${resetLink}`;

    // Build List-Unsubscribe header: prefer explicit env var, fallback to mailto:postmaster@domain and APP_BASE_URL
    const appBase = process.env.APP_BASE_URL || 'http://localhost:5173';
    const unsubscribeEmail = process.env.LIST_UNSUBSCRIBE_EMAIL || `postmaster@${(process.env.SENDGRID_FROM || process.env.SMTP_FROM || 'local.local').split('@')[1] || 'local.local'}`;
    const unsubscribeUrl = process.env.LIST_UNSUBSCRIBE_URL || `${appBase.replace(/\/$/, '')}/unsubscribe`;
    const listUnsubscribe = `<mailto:${unsubscribeEmail}>, <${unsubscribeUrl}>`;

    try {
      const fromAddress = process.env.SENDGRID_FROM || process.env.SMTP_FROM || 'no-reply@local.local';
      if (sendgrid) {
        // Use SendGrid API — include List-Unsubscribe header and both text/html
        const msg = {
          to: user.email,
          from: fromAddress,
          subject,
          text,
          html,
          headers: { 'List-Unsubscribe': listUnsubscribe }
        };
        await sendgrid.send(msg);
        console.info('Password reset email sent via SendGrid to', user.email);
        return { previewUrl: null };
      } else {
        const mailOptions = {
          from: fromAddress,
          to: user.email,
          subject,
          text,
          html,
          headers: { 'List-Unsubscribe': listUnsubscribe }
        };
        const info = await this.mailer.sendMail(mailOptions);
        // If using Ethereal or similar test accounts, log preview URL
        try {
          const preview = nodemailer.getTestMessageUrl(info);
          if (preview) {
            console.info('Password reset email preview URL:', preview);
            return { previewUrl: preview };
          }
        } catch (e) {}
        return { previewUrl: null };
      }
    } catch (e) {
      console.error('Error sending reset email', e);
    }
  }

  async resetPassword({ idUsuario, token, newPassword }) {
    if (!idUsuario || !token || !newPassword) {
      const err = new Error('Datos incompletos'); err.status = 400; throw err;
    }
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const row = await this.passwordResetRepo.findValidByUsuarioAndTokenHash(idUsuario, tokenHash);
    if (!row) { const err = new Error('Token inválido o expirado'); err.status = 401; throw err; }

    // update password
    const hashed = bcrypt.hashSync(String(newPassword), 10);
      await this.db.withTransaction(async (conn) => {
        await conn.query('UPDATE usuarios SET password = ?, tokenVersion = COALESCE(tokenVersion,0) + 1 WHERE idUsuario = ?', [hashed, idUsuario]);
        await this.passwordResetRepo.markUsed(row.id, conn);
    });
  }
}

module.exports = { AuthService };
