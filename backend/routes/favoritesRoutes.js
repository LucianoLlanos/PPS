const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas de favoritos requieren autenticación
// router.use(authenticateToken); // Lo aplicaremos a cada ruta individual

// Rutas de favoritos
router.get('/', authMiddleware, favoritesController.getUserFavorites);
router.post('/', authMiddleware, favoritesController.addToFavorites);
router.delete('/:idProducto', authMiddleware, favoritesController.removeFromFavorites);
router.get('/:idProducto/check', authMiddleware, favoritesController.isFavorite);

module.exports = router;