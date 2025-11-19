const express = require('express');
const router = express.Router();
const multer = require('multer');
const { makeDiskStorage } = require('../core/uploads');
const sellerController = require('../controllers/sellerController');

// Multer setup centralizado
const storage = makeDiskStorage('.');
const upload = multer({ storage });

// Products
router.post('/products', upload.single('image'), sellerController.createProduct);
router.get('/products', sellerController.listProducts);
router.get('/products/:id(\\d+)', sellerController.getProduct);
router.put('/products/:id(\\d+)', upload.single('image'), sellerController.updateProduct);
router.delete('/products/:id(\\d+)', sellerController.deleteProduct);

// Orders
router.post('/orders', sellerController.createOrder);
router.get('/orders', sellerController.listOrders);
router.put('/orders/:id(\\d+)/status', sellerController.updateOrderStatus);

// Carousel
router.post('/carousel', upload.single('image'), sellerController.createSlide);
router.get('/carousel', sellerController.listSlides);
router.delete('/carousel/:id(\\d+)', sellerController.deleteSlide);

module.exports = router;
