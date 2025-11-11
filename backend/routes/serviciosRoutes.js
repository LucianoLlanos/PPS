const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/serviciosController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRoleId } = require('../middleware/roleMiddleware');

// Obtener tipos de servicios disponibles (público)
router.get('/tipos', serviciosController.getTiposServicio);

// Crear nueva solicitud de servicio (requiere autenticación)
router.post('/solicitar', authMiddleware, serviciosController.crearSolicitudServicio);

// Obtener solicitudes del usuario logueado
router.get('/mis-solicitudes', authMiddleware, serviciosController.getSolicitudesUsuario);

// Rutas de administrador (requieren rol admin)
router.get('/admin/todas', authMiddleware, requireRoleId(3), serviciosController.getSolicitudesServicio);
router.put('/admin/solicitud/:idSolicitud', authMiddleware, requireRoleId(3), serviciosController.actualizarEstadoSolicitud);

module.exports = router;