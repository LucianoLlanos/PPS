const { ServicioService } = require('../services/servicioService');
const { AppError } = require('../core/errors');

class ServiciosController {
  constructor(service = new ServicioService()) {
    this.service = service;
    this.getSolicitudesServicio = this.getSolicitudesServicio.bind(this);
    this.getSolicitudesUsuario = this.getSolicitudesUsuario.bind(this);
    this.crearSolicitudServicio = this.crearSolicitudServicio.bind(this);
    this.getSolicitudById = this.getSolicitudById.bind(this);
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
      const result = await this.service.create(req.user, req.body);
      // result may include phoneUpdated flag
      res.status(201).json({ message: 'Solicitud de servicio creada exitosamente', ...result });
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

  async getSolicitudById(req, res) {
    try {
      const { idSolicitud } = req.params;
      console.debug('[ServiciosController] getSolicitudById called, idSolicitud=', idSolicitud, 'user=', req.user ? { idUsuario: req.user.idUsuario, idRol: req.user.idRol } : null);
      if (!idSolicitud) return res.status(400).json({ error: 'Falta id de solicitud' });
      const row = await (this.service.getByIdSafe ? this.service.getByIdSafe(idSolicitud) : this.service.getById(idSolicitud));
      if (!row) return res.status(404).json({ error: 'Solicitud no encontrada' });
      res.json(row);
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
      console.error('Error al obtener solicitud por id:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  getTiposServicio(req, res) { res.json(this.service.tipos()); }
}

module.exports = new ServiciosController();