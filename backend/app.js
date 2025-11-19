const express = require('express');
const cors = require('cors');
const path = require('path');
const { Config } = require('./core/config');
const { Logger } = require('./core/logger');
const { errorHandler } = require('./middleware/errorMiddleware');

class App {
  constructor(cfg = new Config(), logger = new Logger('app')) {
    this.config = cfg;
    this.logger = logger;
    this.app = express();
    this.configure();
    this.registerRoutes();
    this.app.use(errorHandler);
  }

  configure() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    this.app.get('/health', (req, res) => res.json({ status: 'ok' }));
  }

  registerRoutes() {
    const adminRoutes = require('./routes/adminRoutes');
    const serviciosRoutes = require('./routes/serviciosRoutes');
    const empresaRoutes = require('./routes/empresaRoutes');
    const carouselRoutes = require('./routes/carouselRoutes');
    const sellerRoutes = require('./routes/sellerRoutes');
    const authRoutes = require('./routes/authRoutes');
    const favoritesRoutes = require('./routes/favoritesRoutes');
    const ordersRoutes = require('./routes/ordersRoutes');
    const authMiddleware = require('./middleware/authMiddleware');
    const { requireRoleId } = require('./middleware/roleMiddleware');

    // Productos públicos (usamos index para sus handlers actuales)
    const { ProductService } = require('./services/productService');
    const productService = new ProductService();
    this.app.get('/productos', async (req, res) => {
      try { res.json(await productService.listProducts()); }
      catch (e) { this.logger.error('Error al obtener productos', e); res.status(500).json({ error: 'Error al obtener productos' }); }
    });
    this.app.get('/productos/:id', async (req, res) => {
      try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID inválido' });
        const prod = await productService.getProductById(id);
        if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(prod);
      } catch (e) {
        this.logger.error('Error al obtener producto', e);
        res.status(500).json({ error: 'Error al obtener producto' });
      }
    });

    this.app.use('/auth', authRoutes);
    this.app.use('/favorites', favoritesRoutes);
    this.app.use('/orders', ordersRoutes);
    this.app.use('/servicios', serviciosRoutes);
    this.app.use('/empresa', empresaRoutes);
    this.app.use('/carousel', carouselRoutes);
    this.app.use('/seller', authMiddleware, requireRoleId(2, 3), sellerRoutes);
    this.app.use('/admin', authMiddleware, (req, res, next) => {
      const userRole = req.user.idRol;
      if (userRole === 2 || userRole === 3) return next();
      res.status(403).json({ error: 'Acceso denegado' });
    }, adminRoutes);
  }

  listen() {
    const port = this.config.port;
    this.app.listen(port, () => {
      this.logger.info(`Servidor backend escuchando en puerto ${port}`);
      this.logger.info('Endpoint público /productos registrado');
      this.logger.info('Endpoint de salud disponible en /health');
    });
  }
}

module.exports = { App };
