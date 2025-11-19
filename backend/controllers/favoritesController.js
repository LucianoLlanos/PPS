const { FavoritesService } = require('../services/favoritesService');
const { AppError } = require('../core/errors');

class FavoritesController {
  constructor(service = new FavoritesService()) {
    this.service = service;
    this.getUserFavorites = this.getUserFavorites.bind(this);
    this.addToFavorites = this.addToFavorites.bind(this);
    this.removeFromFavorites = this.removeFromFavorites.bind(this);
    this.isFavorite = this.isFavorite.bind(this);
  }

  async getUserFavorites(req, res) {
    try {
      const data = await this.service.list(req.user);
      res.json(data);
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ message: err.message, code: err.code });
      console.error('❌ Error obteniendo favoritos:', err);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }

  async addToFavorites(req, res) {
    try {
      const { idProducto } = req.body;
      const result = await this.service.add(req.user, idProducto);
      res.status(201).json({ message: 'Producto agregado a favoritos', ...result });
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ message: err.message, code: err.code });
      console.error('❌ Error agregando favorito:', err);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }

  async removeFromFavorites(req, res) {
    try {
      const { idProducto } = req.params;
      await this.service.remove(req.user, idProducto);
      res.json({ message: 'Producto eliminado de favoritos' });
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ message: err.message, code: err.code });
      console.error('❌ Error eliminando favorito:', err);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }

  async isFavorite(req, res) {
    try {
      const { idProducto } = req.params;
      const result = await this.service.isFavorite(req.user, idProducto);
      res.json(result);
    } catch (err) {
      if (err instanceof AppError) return res.status(err.status).json({ message: err.message, code: err.code });
      console.error('Error verificando favorito:', err);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
}

module.exports = new FavoritesController();