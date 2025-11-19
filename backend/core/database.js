const { pool } = require('../db/pool');
const { AppError } = require('./errors');

class Database {
  constructor(p = pool) {
    this.pool = p;
  }

  async query(sql, params = []) {
    const [rows] = await this.pool.query(sql, params);
    return rows;
  }

  async getConnection() {
    return this.pool.getConnection();
  }

  async withTransaction(fn) {
    const conn = await this.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (err) {
      try { await conn.rollback(); } catch (_) {}
      throw err instanceof Error ? err : new AppError('Error en transacción');
    } finally {
      conn.release();
    }
  }
}

module.exports = { Database };
