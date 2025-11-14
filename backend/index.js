const express = require('express');
const cors = require('cors');
const app = express();
const adminRoutes = require('./routes/adminRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const carouselRoutes = require('./routes/carouselRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const { requireRoleId } = require('./middleware/roleMiddleware');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check - primero
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint público para listar productos (sin autenticación)
const { connection } = require('./db/DB');
app.get('/productos', (req, res) => {
  const query = `
    SELECT 
      p.idProducto, p.nombre, p.descripcion, p.precio, p.stockTotal AS stock, p.imagen,
      GROUP_CONCAT(pi.imagen ORDER BY pi.orden) as imagenes
    FROM productos p 
    LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id 
    GROUP BY p.idProducto
  `;
  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener productos' });
    
    // Procesar resultados para convertir imagenes de string a array
    const processedResults = results.map(producto => ({
      ...producto,
      imagenes: producto.imagenes ? producto.imagenes.split(',') : []
    }));
    
    res.json(processedResults);
  });
});

// Endpoint detalle de producto por id
app.get('/productos/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });
  const query = `
    SELECT 
      p.idProducto, p.nombre, p.descripcion, p.precio, p.stockTotal AS stock, p.imagen,
      GROUP_CONCAT(pi.imagen ORDER BY pi.orden) as imagenes
    FROM productos p 
    LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id 
    WHERE p.idProducto = ?
    GROUP BY p.idProducto
  `;
  connection.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener producto' });
    if (!results || results.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    const r = results[0];
    const producto = { ...r, imagenes: r.imagenes ? r.imagenes.split(',') : [] };
    res.json(producto);
  });
});

app.use('/auth', authRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/orders', ordersRoutes);
app.use('/servicios', serviciosRoutes);
app.use('/empresa', empresaRoutes);
app.use('/carousel', carouselRoutes);

// Rutas para vendedores/admin (seller namespace)
app.use('/seller', authMiddleware, requireRoleId(2, 3), sellerRoutes);

// Proteger rutas administrativas con autenticación - permitir Admin (idRol = 3) y Vendedor (idRol = 2)
// Usar prefijo /admin para evitar conflictos con endpoints públicos
app.use('/admin', authMiddleware, (req, res, next) => {
  // El payload del token usa la propiedad idRol (ver authController)
  const userRole = req.user.idRol;
  if (userRole === 2 || userRole === 3) {
    next();
  } else {
    res.status(403).json({ error: 'Acceso denegado' });
  }
}, adminRoutes);

app.listen(3000, () => {
  console.log('Servidor backend escuchando en puerto 3000');
  console.log('Endpoint público /productos registrado');
  console.log('Endpoint de salud disponible en /health');
});
