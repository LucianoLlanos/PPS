const rateLimit = require('express-rate-limit');

// Limite básico para evitar abuso de endpoints públicos sensibles
const createRateLimiter = ({ windowMs = 60 * 60 * 1000, max = 5, message = 'Demasiadas solicitudes, intente más tarde.' } = {}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
  });
};

module.exports = { createRateLimiter };
