class Logger {
  constructor(context = 'app') {
    this.context = context;
  }
  with(ctx) { return new Logger(ctx); }
  info(...args) { console.log(`[INFO][${this.context}]`, ...args); }
  warn(...args) { console.warn(`[WARN][${this.context}]`, ...args); }
  error(...args) { console.error(`[ERROR][${this.context}]`, ...args); }
  debug(...args) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG][${this.context}]`, ...args);
    }
  }
}

module.exports = { Logger };
