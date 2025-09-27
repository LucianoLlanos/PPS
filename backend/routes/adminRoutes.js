const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController.js');

// Usuarios
router.get('/usuarios', adminController.listarUsuarios);
router.post('/usuarios', adminController.crearUsuario);
router.put('/usuarios/:id', adminController.actualizarUsuario);
router.delete('/usuarios/:id', adminController.eliminarUsuario);

// Productos
router.get('/productos', adminController.listarProductos);
router.post('/productos', adminController.crearProducto);
router.put('/productos/:id', adminController.actualizarProducto);
router.delete('/productos/:id', adminController.eliminarProducto);

// Pedidos
router.get('/pedidos', adminController.listarPedidos);
router.post('/pedidos', adminController.crearPedido);
router.get('/pedidos/:id', adminController.verDetallePedido);
router.delete('/pedidos/:id', adminController.eliminarPedido);
router.put('/pedidos/:id', adminController.actualizarPedido);

// Ventas (alias de pedidos para compatibilidad frontend)
router.get('/ventas', adminController.listarPedidos);
router.post('/ventas', adminController.crearPedido);
router.get('/ventas/:id', adminController.verDetallePedido);
router.delete('/ventas/:id', adminController.eliminarPedido);
router.put('/ventas/:id', adminController.actualizarPedido);

// Sucursales, clientes, servicios
router.get('/sucursales', adminController.listarSucursales);
router.get('/clientes', adminController.listarClientes);
router.get('/servicios', adminController.listarServicios);
router.get('/stock_sucursal', adminController.listarStockSucursal);
// Actualizar stock por sucursal (idSucursal, idProducto)
router.put('/stock_sucursal/:idSucursal/:idProducto', adminController.actualizarStockSucursal);
// Backfill para crear filas faltantes en stock_sucursal
router.post('/stock_sucursal/backfill', adminController.backfillStockSucursales);
// Reconciliar stockTotal de un producto con stock_sucursal
router.post('/productos/:idProducto/reconcile', adminController.reconcileStockProducto);

module.exports = router;
