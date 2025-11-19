const { Database } = require('../core/database');
const { AppError } = require('../core/errors');
const { CarouselRepository } = require('../repositories/CarouselRepository');

class CarouselService {
  constructor(db = new Database()) {
    this.db = db;
    this.repo = new CarouselRepository(db);
  }

  async listPublic() { return this.repo.findPublic(); }
  async listAll() { return this.repo.findAll(); }

  async create({ titulo, descripcion, imagen, enlace, orden, activo }) {
    if (!titulo || !imagen) throw AppError.badRequest('Título e imagen son requeridos');
    const id = await this.repo.create({ titulo, descripcion, imagen, enlace, orden, activo });
    return { id };
  }

  async update(id, { titulo, descripcion, imagen, enlace, orden, activo }) {
    if (!titulo) throw AppError.badRequest('Título es requerido');
    const affected = await this.repo.update({ id, titulo, descripcion, imagen, enlace, orden, activo });
    if (affected === 0) throw AppError.notFound('Banner no encontrado');
    return { updated: true };
  }

  async remove(id) {
    const affected = await this.repo.remove(id);
    if (affected === 0) throw AppError.notFound('Banner no encontrado');
    return { removed: true };
  }

  async setActive(id, activo) {
    const affected = await this.repo.setActive(id, activo);
    if (affected === 0) throw AppError.notFound('Banner no encontrado');
    return { updated: true };
  }

  async reorder(banners) {
    if (!Array.isArray(banners)) throw AppError.badRequest('Se requiere un array de banners');
    await this.repo.updateOrder(banners);
    return { updated: true };
  }
}

module.exports = { CarouselService };
