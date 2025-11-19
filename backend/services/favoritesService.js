const { Database } = require('../core/database');
const { AppError } = require('../core/errors');
const { FavoritesRepository } = require('../repositories/FavoritesRepository');
const { ProductRepository } = require('../repositories/ProductRepository');

class FavoritesService {
  constructor(db = new Database()) {
    this.db = db;
    this.repo = new FavoritesRepository(db);
    this.productRepo = new ProductRepository(db);
  }

  async list(user) {
    const rows = await this.repo.listByUsuario(user.idUsuario);
    return rows.map((r) => {
      const imgs = r.imagenes ? r.imagenes.split(',') : [];
      const finalImgs = imgs.length > 0 ? imgs : (r.imagen ? [r.imagen] : []);
      return { ...r, imagenes: finalImgs };
    });
  }

  async add(user, idProducto) {
    if (!idProducto) throw AppError.badRequest('ID del producto requerido');
    const exists = await this.productRepo.getBasicById(idProducto);
    if (!exists) throw AppError.notFound('Producto no encontrado');
    try {
      const id = await this.repo.addFavorite(user.idUsuario, idProducto);
      return { favoriteId: id };
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') throw AppError.badRequest('El producto ya está en favoritos');
      throw err;
    }
  }

  async remove(user, idProducto) {
    const affected = await this.repo.removeFavorite(user.idUsuario, idProducto);
    if (affected === 0) throw AppError.notFound('Favorito no encontrado');
    return { removed: true };
  }

  async isFavorite(user, idProducto) {
    return { isFavorite: await this.repo.existsFavorite(user.idUsuario, idProducto) };
  }
}

module.exports = { FavoritesService };
