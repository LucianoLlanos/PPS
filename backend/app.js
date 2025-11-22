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
      try {
        const idSucursal = req.query && req.query.idSucursal ? Number(req.query.idSucursal) : undefined;
        res.json(await productService.listProducts(idSucursal));
      } catch (e) { this.logger.error('Error al obtener productos', e); res.status(500).json({ error: 'Error al obtener productos' }); }
    });
    this.app.get('/productos/:id', async (req, res) => {
      try {
        const id = Number(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID inválido' });
        const idSucursal = req.query && req.query.idSucursal ? Number(req.query.idSucursal) : undefined;
        const prod = await productService.getProductById(id, idSucursal);
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

  scheduleJobs() {
    // schedule cleanup of expired password reset tokens
    try {
      const cron = require('node-cron');
      const { PasswordResetRepository } = require('./repositories/PasswordResetRepository');
      const repo = new PasswordResetRepository(this.config.db);
      // run every hour at minute 5
      cron.schedule('5 * * * *', async () => {
        try {
          await repo.deleteExpired();
          this.logger.info('Password resets cleanup executed');
        } catch (e) { this.logger.error('Error cleaning password_resets', e); }
      });
    } catch (e) {
      this.logger.warn('node-cron not available; skipping scheduled cleanup for password_resets');
    }
  }

  listen() {
    const port = this.config.port;
    const http = require('http');
    const server = http.createServer(this.app);

    // Configure Socket.IO
    try {
      const { Server } = require('socket.io');
      const io = new Server(server, { cors: { origin: '*' } });
      // store io instance for other modules
      const { setIO } = require('./core/socket');
      setIO(io);

      io.on('connection', (socket) => {
        this.logger.info('Socket conectado: ' + socket.id);

        socket.on('authenticate', async (data) => {
          try {
            const jwt = require('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
            if (!data || !data.token) return;
            const payload = jwt.verify(data.token, JWT_SECRET);
            // validate tokenVersion and role from DB
            const { Database } = require('./core/database');
            const db = new Database();
            const sql = 'SELECT tokenVersion, idRol FROM usuarios WHERE idUsuario = ?';
            const rows = await db.query(sql, [payload.idUsuario]);
            if (!rows || rows.length === 0) return;
            const row = rows[0];
            if (Number(row.tokenVersion || 0) !== Number(payload.tokenVersion || 0)) return;
            // If role is admin (3) or vendor (2) join admin room
            if (Number(row.idRol) === 3) {
              socket.join('admins');
              socket.emit('authenticated', { ok: true, role: 'admin' });
              this.logger.info('Socket joined admins room: ' + socket.id + ' (user: ' + (payload.idUsuario || 'unknown') + ')');
            }
          } catch (e) {
            // ignore invalid token
            this.logger.warn('Socket authenticate failed', e && e.message ? e.message : e);
          }
        });

        socket.on('disconnect', () => {
          this.logger.info('Socket desconectado: ' + socket.id);
        });
      });
    } catch (e) {
      this.logger.warn('Socket.IO no disponible; continuar sin WebSocket', e && e.message ? e.message : e);
    }

    server.listen(port, () => {
      this.logger.info(`Servidor backend escuchando en puerto ${port}`);
      this.logger.info('Endpoint público /productos registrado');
      this.logger.info('Endpoint de salud disponible en /health');
    });

    // schedule background jobs after server starts
    try { this.scheduleJobs(); } catch (e) { this.logger.warn('scheduleJobs failed', e); }
  }
}

module.exports = { App };
