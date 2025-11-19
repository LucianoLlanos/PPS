class Config {
  constructor(env = process.env) {
    this.env = env;
    this.port = Number(env.PORT || 3000);
    this.mysql = {
      host: env.MYSQL_HOST || '127.0.0.1',
      user: env.MYSQL_USER || 'root',
      password: env.MYSQL_PASSWORD || 'root',
      database: env.MYSQL_DB || 'atilio_marola',
      connectionLimit: Number(env.MYSQL_POOL_SIZE || 10),
    };
    this.jwtSecret = env.JWT_SECRET || 'dev-secret';
    this.nodeEnv = env.NODE_ENV || 'development';
  }
  isProd() { return this.nodeEnv === 'production'; }
}

module.exports = { Config };
