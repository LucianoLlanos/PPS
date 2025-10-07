const express = require('express');
const cors = require('cors');
const app = express();
const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const { requireRoleId } = require('./middleware/roleMiddleware');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Endpoint público para listar productos (sin autenticación)
const { connection } = require('./db/DB');
app.get('/productos', (req, res) => {
  connection.query('SELECT idProducto, nombre, descripcion, precio, stockTotal AS stock FROM productos', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener productos' });
    res.json(results);
  });
});

// Endpoint de diagnóstico para la vista admin: devuelve conteos y muestras de tablas relevantes
app.get('/debug/admin-status', async (req, res) => {
  try {
    const q = (sql) => new Promise((resolve, reject) => connection.query(sql, (err, rows) => err ? reject(err) : resolve(rows)));
    const usuarios = await q('SELECT COUNT(*) AS total FROM usuarios');
    const productos = await q('SELECT COUNT(*) AS total FROM productos');
    const sucursales = await q('SELECT COUNT(*) AS total FROM sucursales');
    const stock = await q('SELECT COUNT(*) AS total FROM stock_sucursal');
    const sampleProductos = await q('SELECT idProducto, nombre, precio, stockTotal FROM productos LIMIT 5');
    res.json({ usuarios: usuarios[0].total, productos: productos[0].total, sucursales: sucursales[0].total, stock: stock[0].total, sampleProductos });
  } catch (err) {
    console.error('debug/admin-status error', err);
    res.status(500).json({ error: 'Error en diagnóstico', detail: err.message });
  }
});

app.use('/auth', authRoutes);
// Temporalmente deshabilitado auth/roles para pruebas: montar adminRoutes sin middleware
app.use('/', adminRoutes);
// Nota: rutas de vendedor deshabilitadas — revertidas por petición del usuario
// Si en el futuro quiere restaurarlas, reactivar la siguiente línea:
// app.use('/seller', authMiddleware, requireRoleId(2), sellerRoutes);

app.listen(3000, () => {
  console.log('Servidor backend escuchando en puerto 3000');
  console.log('Endpoint público /productos registrado');
  console.log('Endpoint de salud disponible en /health');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
