const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Rutas para clientes  
router.post('/create', authMiddleware, ordersController.createOrder);
router.get('/my-orders', authMiddleware, ordersController.getMyOrders);
router.get('/my-orders/:id', authMiddleware, ordersController.getMyOrderDetails);

module.exports = router;