const { AppError } = require('../core/errors');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code, meta: err.meta });
  }
  console.error('[UNHANDLED ERROR]', err);
  res.status(500).json({ error: 'Error del servidor' });
}

module.exports = { errorHandler };
