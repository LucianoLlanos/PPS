const { AuthService } = require('../services/authService');
const { AppError } = require('../core/errors');

class AuthController {
  constructor(service = new AuthService()) {
    this.service = service;
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await this.service.login({ email, password });
      res.json(result);
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ error: err.message, code: err.code });
      console.error('[auth] unhandled error on login:', err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }

  async register(req, res) {
    try {
      const result = await this.service.register(req.body);
      res.json(result);
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ error: err.message, code: err.code });
      console.error('[auth] unhandled error on register:', err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body || {};
      await this.service.requestPasswordReset(email, req.ip, req.get('User-Agent'));
      // Always return 200 for privacy (no enumeration)
      res.json({ message: 'Si existe una cuenta, recibirás un correo con instrucciones para restablecer la contraseña.' });
    } catch (err) {
      console.error('[auth] forgotPassword error:', err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }

  async resetPassword(req, res) {
    try {
      const { idUsuario, token, newPassword } = req.body || {};
      await this.service.resetPassword({ idUsuario, token, newPassword });
      res.json({ message: 'Contraseña restablecida correctamente' });
    } catch (err) {
      if (err && err.status) return res.status(err.status).json({ error: err.message });
      console.error('[auth] resetPassword error:', err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }
}

module.exports = new AuthController();
