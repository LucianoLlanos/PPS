const { ServicioService } = require('../services/servicioService');
const { AppError } = require('../core/errors');

class ServiciosController {
  constructor(service = new ServicioService()) {
    this.service = service;
    this.getSolicitudesServicio = this.getSolicitudesServicio.bind(this);
    this.getSolicitudesUsuario = this.getSolicitudesUsuario.bind(this);
    this.crearSolicitudServicio = this.crearSolicitudServicio.bind(this);
    this.actualizarEstadoSolicitud = this.actualizarEstadoSolicitud.bind(this);
    this.getTiposServicio = this.getTiposServicio.bind(this);
  }

  async getSolicitudesServicio(req, res) {
    try { res.json(await this.service.listAll()); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('Error al obtener solicitudes de servicio:', err); res.status(500).json({ error: 'Error interno del servidor' }); }
  }

  async getSolicitudesUsuario(req, res) {
    try { res.json(await this.service.listMine(req.user)); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('Error al obtener solicitudes del usuario:', err); res.status(500).json({ error: 'Error interno del servidor' }); }
  }

  async crearSolicitudServicio(req, res) {
    try {
      const { idSolicitud } = await this.service.create(req.user, req.body);
      res.status(201).json({ message: 'Solicitud de servicio creada exitosamente', idSolicitud });
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
      console.error('Error al crear solicitud de servicio:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async actualizarEstadoSolicitud(req, res) {
    try {
      const { idSolicitud } = req.params;
      await this.service.updateEstado(idSolicitud, req.body);
      res.json({ message: 'Solicitud actualizada exitosamente' });
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
      console.error('Error al actualizar solicitud:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  getTiposServicio(req, res) { res.json(this.service.tipos()); }
}

module.exports = new ServiciosController();