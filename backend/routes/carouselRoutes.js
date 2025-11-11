const express = require('express');
const router = express.Router();
const carouselController = require('../controllers/carouselController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRoleId } = require('../middleware/roleMiddleware');

// Rutas públicas
router.get('/public', carouselController.obtenerBannersPublicos);

// Rutas administrativas (requieren autenticación y rol de admin)
router.get('/admin', authMiddleware, requireRoleId(3), carouselController.obtenerTodosBanners);
router.post('/admin', authMiddleware, requireRoleId(3), carouselController.upload.single('imagen'), carouselController.crearBanner);
router.put('/admin/:id', authMiddleware, requireRoleId(3), carouselController.upload.single('imagen'), carouselController.actualizarBanner);
router.delete('/admin/:id', authMiddleware, requireRoleId(3), carouselController.eliminarBanner);
router.patch('/admin/:id/estado', authMiddleware, requireRoleId(3), carouselController.cambiarEstadoBanner);
router.put('/admin/reordenar', authMiddleware, requireRoleId(3), carouselController.reordenarBanners);

module.exports = router;