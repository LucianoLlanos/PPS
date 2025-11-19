const express = require('express');
const multer = require('multer');
const { makeDiskStorage } = require('../core/uploads');
const { 
  obtenerInfoEmpresa, 
  actualizarInfoEmpresa, 
  obtenerArchivoPdf, 
  eliminarArchivoPdf,
  obtenerOrganizacion,
  crearCargo,
  actualizarCargo,
  eliminarCargo,
  obtenerFotoCargo
} = require('../controllers/empresaController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRoleId } = require('../middleware/roleMiddleware');

const router = express.Router();

// Storage centralizado en /uploads
const storage = makeDiskStorage('.');

// Filtro para archivos PDF
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
};

// Filtro para imágenes (fotos de cargos)
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

// Configuración para PDFs
const uploadPdf = multer({ 
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  }
});

// Configuración para imágenes (fotos de cargos)
const uploadImage = multer({ 
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite para imágenes
  }
});

// Rutas públicas (solo lectura)
router.get('/', obtenerInfoEmpresa);
router.get('/pdf', obtenerArchivoPdf);
router.get('/organizacion', obtenerOrganizacion);
router.get('/cargo/:id(\\d+)/foto', obtenerFotoCargo);

// Rutas protegidas (solo admin)
router.put('/', authMiddleware, requireRoleId(3), uploadPdf.single('archivoPdf'), actualizarInfoEmpresa);
router.delete('/pdf', authMiddleware, requireRoleId(3), eliminarArchivoPdf);

// Rutas de organización (solo admin)
router.post('/cargo', authMiddleware, requireRoleId(3), uploadImage.single('foto'), crearCargo);
router.put('/cargo/:id(\\d+)', authMiddleware, requireRoleId(3), uploadImage.single('foto'), actualizarCargo);
router.delete('/cargo/:id(\\d+)', authMiddleware, requireRoleId(3), eliminarCargo);

module.exports = router;