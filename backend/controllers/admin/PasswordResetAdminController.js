const { PasswordResetRepository } = require('../../repositories/PasswordResetRepository');

class PasswordResetAdminController {
  constructor(repo = new PasswordResetRepository()) {
    this.repo = repo;
    this.cleanup = this.cleanup.bind(this);
    this.report = this.report.bind(this);
  }

  async cleanup(req, res) {
    try {
      await this.repo.deleteExpired();
      res.json({ message: 'Limpieza ejecutada' });
    } catch (e) {
      console.error('Error cleaning password_resets', e);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  async report(req, res) {
    try {
      const s = await this.repo.stats();
      res.json(s);
    } catch (e) {
      console.error('Error generating password_resets report', e);
      res.status(500).json({ error: 'Error interno' });
    }
  }
}

module.exports = new PasswordResetAdminController();
