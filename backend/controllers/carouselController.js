const multer = require('multer');
const path = require('path');
const { makeDiskStorage } = require('../core/uploads');
const { CarouselService } = require('../services/carouselService');
const { AppError } = require('../core/errors');

// Configuración de multer para subida de imágenes
const storage = makeDiskStorage('.');
const upload = multer({ storage });

class CarouselController {
  constructor(service = new CarouselService()) {
    this.service = service;
    this.obtenerBannersPublicos = this.obtenerBannersPublicos.bind(this);
    this.obtenerTodosBanners = this.obtenerTodosBanners.bind(this);
    this.crearBanner = this.crearBanner.bind(this);
    this.actualizarBanner = this.actualizarBanner.bind(this);
    this.eliminarBanner = this.eliminarBanner.bind(this);
    this.cambiarEstadoBanner = this.cambiarEstadoBanner.bind(this);
    this.reordenarBanners = this.reordenarBanners.bind(this);
  }

  async obtenerBannersPublicos(req, res) {
    try { res.json(await this.service.listPublic()); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('❌ Error obteniendo banners públicos:', err); res.status(500).json({ error: 'Error interno del servidor' }); }
  }

// Obtener todos los banners para administración
  async obtenerTodosBanners(req, res) {
    try { res.json(await this.service.listAll()); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('❌ Error obteniendo todos los banners:', err); res.status(500).json({ error: 'Error interno del servidor' }); }
  }

// Crear nuevo banner
  async crearBanner(req, res) {
    try {
      const { titulo, descripcion, enlace, orden, activo } = req.body;
      const imagen = req.file ? req.file.filename : null;
      const { id } = await this.service.create({ titulo, descripcion, imagen, enlace, orden, activo });
      res.status(201).json({ message: 'Banner creado exitosamente', id });
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
      console.error('Error creando banner:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

// Actualizar banner existente
  async actualizarBanner(req, res) {
    try {
      const { id } = req.params;
      const { titulo, descripcion, enlace, orden, activo } = req.body;
      const nuevaImagen = req.file ? req.file.filename : null;
      await this.service.update(id, { titulo, descripcion, imagen: nuevaImagen, enlace, orden, activo });
      res.json({ message: 'Banner actualizado exitosamente' });
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
      console.error('Error actualizando banner:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

// Eliminar banner
  async eliminarBanner(req, res) {
    try { await this.service.remove(req.params.id); res.json({ message: 'Banner eliminado exitosamente' }); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('Error eliminando banner:', err); res.status(500).json({ error: 'Error interno del servidor' }); }
  }

// Cambiar estado activo/inactivo
  async cambiarEstadoBanner(req, res) {
    try { await this.service.setActive(req.params.id, req.body.activo); res.json({ message: 'Estado del banner actualizado exitosamente' }); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('Error cambiando estado del banner:', err); res.status(500).json({ error: 'Error interno del servidor' }); }
  }

// Reordenar banners
  async reordenarBanners(req, res) {
    try { await this.service.reorder(req.body.banners); res.json({ message: 'Orden de banners actualizado exitosamente' }); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('Error reordenando banners:', err); res.status(500).json({ error: 'Error interno del servidor' }); }
  }
}

module.exports = Object.assign(new CarouselController(), { upload });