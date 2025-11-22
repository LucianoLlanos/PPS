const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.register);
// Rate limit the forgot endpoint to avoid abuse (5 reqs per hour per IP default)
router.post('/forgot', createRateLimiter(), authController.forgotPassword);
router.post('/reset', createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20 }), authController.resetPassword);

module.exports = router;
