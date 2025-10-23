const express = require('express');
const cors = require('cors');
const app = express();
const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes');
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

app.use('/auth', authRoutes);

// Rutas de servicios post-venta
app.use('/servicios', serviciosRoutes);

// Proteger rutas administrativas con autenticación y rol Admin (idRol = 3)
// Si se desea exponer endpoints públicos (por ejemplo listado de productos), mantener rutas públicas
// antes de esta línea.
app.use('/', authMiddleware, requireRoleId(3), adminRoutes);
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
