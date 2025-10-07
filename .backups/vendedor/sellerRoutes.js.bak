const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const sellerController = require('../controllers/sellerController');

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

// Products
router.post('/products', upload.single('image'), sellerController.createProduct);
router.get('/products', sellerController.listProducts);
router.get('/products/:id', sellerController.getProduct);
router.put('/products/:id', upload.single('image'), sellerController.updateProduct);
router.delete('/products/:id', sellerController.deleteProduct);

// Orders
router.post('/orders', sellerController.createOrder);
router.get('/orders', sellerController.listOrders);
router.put('/orders/:id/status', sellerController.updateOrderStatus);

// Carousel
router.post('/carousel', upload.single('image'), sellerController.createSlide);
router.get('/carousel', sellerController.listSlides);
router.delete('/carousel/:id', sellerController.deleteSlide);

module.exports = router;
