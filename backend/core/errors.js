class AppError extends Error {
  constructor(message, status = 500, code = 'APP_ERROR', meta = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (meta) this.meta = meta;
    Error.captureStackTrace?.(this, this.constructor);
  }
  static badRequest(msg, meta) { return new AppError(msg, 400, 'BAD_REQUEST', meta); }
  static unauthorized(msg = 'No autorizado', meta) { return new AppError(msg, 401, 'UNAUTHORIZED', meta); }
  static forbidden(msg = 'Acceso denegado', meta) { return new AppError(msg, 403, 'FORBIDDEN', meta); }
  static notFound(msg = 'No encontrado', meta) { return new AppError(msg, 404, 'NOT_FOUND', meta); }
}

module.exports = { AppError };
