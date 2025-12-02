const express = require('express');
const router = express.Router();
const multer = require('multer');
const { makeDiskStorage } = require('../core/uploads');
// Controladores por dominio
const UsersAdminController = require('../controllers/admin/UsersAdminController');
const ProductsAdminController = require('../controllers/admin/ProductsAdminController');
const OrdersAdminController = require('../controllers/admin/OrdersAdminController');
const StockAdminController = require('../controllers/admin/StockAdminController');
const SucursalesAdminController = require('../controllers/admin/SucursalesAdminController');
const ClientsAdminController = require('../controllers/admin/ClientsAdminController');
const ServiciosPostventaController = require('../controllers/admin/ServiciosPostventaController');
const AnalyticsAdminController = require('../controllers/admin/AnalyticsAdminController');
const PasswordResetAdminController = require('../controllers/admin/PasswordResetAdminController');
const NotificationsAdminController = require('../controllers/admin/NotificationsAdminController');

// Multer setup para subida de imágenes
const storage = makeDiskStorage('.');
const upload = multer({ storage });

// Usuarios
router.get('/usuarios', UsersAdminController.listarUsuarios);
router.post('/usuarios', UsersAdminController.crearUsuario);
router.put('/usuarios/:id(\\d+)', UsersAdminController.actualizarUsuario);
router.delete('/usuarios/:id(\\d+)', UsersAdminController.eliminarUsuario);

// Productos (con soporte de múltiples imágenes)
router.get('/productos', ProductsAdminController.listarProductos);
router.get('/productos/:id(\\d+)', ProductsAdminController.verProductoAdmin);
router.post('/productos', upload.array('imagenes', 5), ProductsAdminController.crearProducto); // Máximo 5 imágenes
router.put('/productos/:id(\\d+)', upload.array('imagenes', 5), ProductsAdminController.actualizarProducto);
router.delete('/productos/:id(\\d+)', ProductsAdminController.eliminarProducto);

// Pedidos
router.get('/pedidos', OrdersAdminController.listarPedidos);
router.post('/pedidos', OrdersAdminController.crearPedido);
// Crear código de retiro para un pedido (no requiere modificar la tabla pedidos)
router.post('/pedidos/:id(\\d+)/retiro', OrdersAdminController.crearRetiro);
// Asegurar que los endpoints que toman :id sólo acepten IDs numéricos (evita colisiones con rutas como /pedidos/summary)
router.get('/pedidos/:id(\\d+)', OrdersAdminController.verDetallePedido);
router.delete('/pedidos/:id(\\d+)', OrdersAdminController.eliminarPedido);
router.put('/pedidos/:id(\\d+)', OrdersAdminController.actualizarPedido);

// Ventas (alias de pedidos para compatibilidad frontend)
router.get('/ventas', OrdersAdminController.listarPedidos);
router.post('/ventas', OrdersAdminController.crearPedido);
// Analytics de ventas (solo pedidos con estado 'Entregado')
router.get('/ventas/summary', AnalyticsAdminController.ventasSummary);
router.get('/ventas/timeseries', AnalyticsAdminController.ventasTimeseries);
router.get('/ventas/top-products', AnalyticsAdminController.ventasTopProducts);
router.get('/ventas/:id(\\d+)', OrdersAdminController.verDetallePedido);
router.delete('/ventas/:id(\\d+)', OrdersAdminController.eliminarPedido);
router.put('/ventas/:id(\\d+)', OrdersAdminController.actualizarPedido);
// (Las rutas de analytics ya están registradas más arriba; evitar duplicados)

// Sucursales, clientes, servicios
router.get('/sucursales', SucursalesAdminController.listarSucursales);
router.get('/clientes', ClientsAdminController.listarClientes);
router.get('/clientes/:id', ClientsAdminController.verCliente);
router.put('/clientes/:id', ClientsAdminController.actualizarCliente);
router.get('/servicios', ServiciosPostventaController.listarServicios);
router.get('/stock_sucursal', StockAdminController.listarStockSucursal);
// Actualizar stock por sucursal (idSucursal, idProducto)
router.put('/stock_sucursal/:idSucursal(\\d+)/:idProducto(\\d+)', StockAdminController.actualizarStockSucursal);
// Backfill para crear filas faltantes en stock_sucursal
router.post('/stock_sucursal/backfill', StockAdminController.backfillStockSucursales);
// Reconciliar stockTotal de un producto con stock_sucursal
router.post('/productos/:idProducto(\\d+)/reconcile', StockAdminController.reconcileStockProducto);
// Reconciliar todos los productos (global)
router.post('/stock/reconcile-all', StockAdminController.reconcileAll);

// Transferir stock entre sucursales
router.post('/stock/transfer', StockAdminController.transferStock);
// Ajuste manual de stock (admin)
router.post('/stock/adjust', StockAdminController.adjustStock);
// Listar movimientos por producto
router.get('/stock/movimientos', StockAdminController.listMovimientos);

// Admin endpoints for password resets
router.post('/password_resets/cleanup', PasswordResetAdminController.cleanup);
router.get('/password_resets/report', PasswordResetAdminController.report);

// Notificaciones (admin)
router.get('/notifications/count-unread', NotificationsAdminController.countUnread);
router.get('/notifications', NotificationsAdminController.list);
router.post('/notifications/:id(\\d+)/mark-read', NotificationsAdminController.markRead);
// Endpoint temporal para testing de notificaciones en vivo
router.post('/notifications/test', NotificationsAdminController.testNotification);

module.exports = router;
