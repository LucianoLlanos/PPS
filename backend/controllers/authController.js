const { AuthService } = require('../services/authService');
const { AppError } = require('../core/errors');

class AuthController {
  constructor(service = new AuthService()) {
    this.service = service;
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
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
}

module.exports = new AuthController();
