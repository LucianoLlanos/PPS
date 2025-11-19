const path = require('path');
const fs = require('fs');
const { Database } = require('../core/database');
const { AppError } = require('../core/errors');
const { EmpresaRepository } = require('../repositories/EmpresaRepository');
const { OrganizacionRepository } = require('../repositories/OrganizacionRepository');

class EmpresaService {
  constructor(db = new Database()) {
    this.db = db;
    this.empresaRepo = new EmpresaRepository(db);
    this.orgRepo = new OrganizacionRepository(db);
    this.uploadDir = path.join(__dirname, '..', 'uploads');
  }

  async getInfo() {
    const info = await this.empresaRepo.getLatestInfo();
    if (!info) throw AppError.notFound('No hay información de la empresa configurada');
    return info;
  }

  async updateInfo(user, { vision, mision, composicion }, archivoPdf) {
    const actualizado_por = (user && (user.nombre || user.apellido) ? `${user.nombre || ''} ${user.apellido || ''}`.trim() : (user?.email || 'Admin'));
    const current = await this.empresaRepo.getOneAny();
    if (!current) {
      const id = await this.empresaRepo.insertInfo({ vision, mision, composicion, archivo_pdf: archivoPdf || null, actualizado_por });
      return { mensaje: 'Información de la empresa actualizada exitosamente', archivoPdf: archivoPdf || null, id };
    } else {
      // If replacing PDF, delete old file if exists
      if (archivoPdf && current.archivo_pdf) {
        const oldPath = path.join(this.uploadDir, current.archivo_pdf);
        fs.unlink(oldPath, () => {});
      }
      await this.empresaRepo.updateInfo({ id: current.id, vision, mision, composicion, archivo_pdf: (typeof archivoPdf !== 'undefined' ? archivoPdf : undefined), actualizado_por });
      return { mensaje: 'Información de la empresa actualizada exitosamente', archivoPdf: archivoPdf || current.archivo_pdf || null };
    }
  }

  async getPdfPath() {
    const row = await this.empresaRepo.getLatestPdf();
    if (!row || !row.archivo_pdf) throw AppError.notFound('No hay archivo PDF disponible');
    const ruta = path.join(this.uploadDir, row.archivo_pdf);
    // Ensure exists
    await new Promise((resolve, reject) => fs.access(ruta, fs.constants.F_OK, (err) => err ? reject(AppError.notFound('Archivo PDF no encontrado')) : resolve()));
    return ruta;
  }

  async deletePdf(user) {
    const actualizado_por = (user && (user.nombre || user.apellido) ? `${user.nombre || ''} ${user.apellido || ''}`.trim() : (user?.email || 'Admin'));
    const row = await this.empresaRepo.getLatestPdf();
    if (!row || !row.archivo_pdf) throw AppError.notFound('No hay archivo PDF para eliminar');
    const ruta = path.join(this.uploadDir, row.archivo_pdf);
    fs.unlink(ruta, () => {});
    await this.empresaRepo.setPdfNull(row.id, actualizado_por);
    return { mensaje: 'Archivo PDF eliminado exitosamente' };
  }

  async getOrganizacion() {
    const rows = await this.orgRepo.getActive();
    const porNivel = {};
    rows.forEach((c) => {
      const nivel = c.nivel_jerarquico;
      if (!porNivel[nivel]) porNivel[nivel] = [];
      porNivel[nivel].push(c);
    });
    return porNivel;
  }

  async crearCargo({ nombre_cargo, descripcion, nivel_jerarquico, orden_en_nivel }, foto) {
    if (!nombre_cargo || !nivel_jerarquico) throw AppError.badRequest('Nombre del cargo y nivel jerárquico son obligatorios');
    const id = await this.orgRepo.insert({ nombre_cargo, descripcion, nivel_jerarquico, foto: foto || null, orden_en_nivel });
    return { mensaje: 'Cargo creado exitosamente', id, foto: foto || null };
  }

  async actualizarCargo(id, { nombre_cargo, descripcion, nivel_jerarquico, orden_en_nivel }, nuevaFoto) {
    if (!nombre_cargo || !nivel_jerarquico) throw AppError.badRequest('Nombre del cargo y nivel jerárquico son obligatorios');
    const actual = await this.orgRepo.getById(id);
    if (!actual) throw AppError.notFound('Cargo no encontrado');
    if (nuevaFoto && actual.foto) {
      const oldPath = path.join(this.uploadDir, actual.foto);
      fs.unlink(oldPath, () => {});
    }
    await this.orgRepo.update({ id, nombre_cargo, descripcion, nivel_jerarquico, foto: (typeof nuevaFoto !== 'undefined' ? nuevaFoto : undefined), orden_en_nivel });
    return { mensaje: 'Cargo actualizado exitosamente', foto: nuevaFoto || actual.foto || null };
  }

  async eliminarCargo(id) {
    const actual = await this.orgRepo.getById(id);
    if (!actual) throw AppError.notFound('Cargo no encontrado');
    if (actual.foto) {
      const ruta = path.join(this.uploadDir, actual.foto);
      fs.unlink(ruta, () => {});
    }
    await this.orgRepo.remove(id);
    return { mensaje: 'Cargo eliminado exitosamente' };
  }

  async getCargoFotoPath(id) {
    const actual = await this.orgRepo.getById(id);
    if (!actual || !actual.foto) throw AppError.notFound('Foto no encontrada');
    const ruta = path.join(this.uploadDir, actual.foto);
    await new Promise((resolve, reject) => fs.access(ruta, fs.constants.F_OK, (err) => err ? reject(AppError.notFound('Archivo de foto no encontrado')) : resolve()));
    return ruta;
  }
}

module.exports = { EmpresaService };
