const path = require('path');
const { EmpresaService } = require('../services/empresaService');
const { AppError } = require('../core/errors');

class EmpresaController {
  constructor(service = new EmpresaService()) {
    this.service = service;
    this.obtenerInfoEmpresa = this.obtenerInfoEmpresa.bind(this);
    this.actualizarInfoEmpresa = this.actualizarInfoEmpresa.bind(this);
    this.obtenerArchivoPdf = this.obtenerArchivoPdf.bind(this);
    this.eliminarArchivoPdf = this.eliminarArchivoPdf.bind(this);
    this.obtenerOrganizacion = this.obtenerOrganizacion.bind(this);
    this.crearCargo = this.crearCargo.bind(this);
    this.actualizarCargo = this.actualizarCargo.bind(this);
    this.eliminarCargo = this.eliminarCargo.bind(this);
    this.obtenerFotoCargo = this.obtenerFotoCargo.bind(this);
  }

  async obtenerInfoEmpresa(req, res) {
    try { res.json(await this.service.getInfo()); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('Error al obtener información de la empresa:', err); res.status(500).json({ error: 'Error al obtener información de la empresa' }); }
  }

  async actualizarInfoEmpresa(req, res) {
    try {
      const archivoPdf = req.file ? req.file.filename : undefined;
      const result = await this.service.updateInfo(req.user, req.body || {}, archivoPdf);
      res.json(result);
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
      console.error('Error al actualizar información de la empresa:', err);
      res.status(500).json({ error: 'Error al actualizar información de la empresa' });
    }
  }

  async obtenerArchivoPdf(req, res) {
    try { const ruta = await this.service.getPdfPath(); res.sendFile(ruta); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('Error al obtener archivo PDF:', err); res.status(500).json({ error: 'Error al obtener archivo PDF' }); }
  }

  async eliminarArchivoPdf(req, res) {
    try { const result = await this.service.deletePdf(req.user); res.json(result); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('Error al eliminar archivo PDF:', err); res.status(500).json({ error: 'Error al eliminar referencia del archivo' }); }
  }

// ========== FUNCIONES PARA ORGANIZACIÓN DE CARGOS ==========

  async obtenerOrganizacion(req, res) {
    try { res.json(await this.service.getOrganizacion()); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('Error al obtener organización:', err); res.status(500).json({ error: 'Error al obtener estructura organizacional' }); }
  }

  async crearCargo(req, res) {
    try {
      const foto = req.file ? req.file.filename : null;
      const result = await this.service.crearCargo(req.body || {}, foto);
      res.json(result);
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
      console.error('Error al crear cargo:', err);
      res.status(500).json({ error: 'Error al crear cargo' });
    }
  }

// Actualizar cargo existente
  async actualizarCargo(req, res) {
    try {
      const { id } = req.params;
      const idNum = Number(id);
      if (!idNum || Number.isNaN(idNum) || idNum <= 0) return res.status(400).json({ error: 'ID inválido' });
      const nueva = req.file ? req.file.filename : undefined;
      const result = await this.service.actualizarCargo(idNum, req.body || {}, nueva);
      res.json(result);
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
      console.error('Error al actualizar cargo:', err);
      res.status(500).json({ error: 'Error al actualizar cargo' });
    }
  }

// Eliminar cargo
  async eliminarCargo(req, res) {
    try { const { id } = req.params; const idNum = Number(id); if (!idNum || Number.isNaN(idNum) || idNum <= 0) return res.status(400).json({ error: 'ID inválido' }); const result = await this.service.eliminarCargo(idNum); res.json(result); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('Error al eliminar cargo:', err); res.status(500).json({ error: 'Error al eliminar cargo' }); }
  }

  async obtenerFotoCargo(req, res) {
    try { const idNum = Number(req.params.id); if (!idNum || Number.isNaN(idNum) || idNum <= 0) return res.status(400).json({ error: 'ID inválido' }); const ruta = await this.service.getCargoFotoPath(idNum); res.sendFile(ruta); }
    catch (err) { if (err instanceof AppError) return res.status(err.status).json({ error: err.message }); console.error('Error al obtener foto del cargo:', err); res.status(500).json({ error: 'Error al obtener foto' }); }
  }
}

module.exports = new EmpresaController();