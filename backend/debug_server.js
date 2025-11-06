// Debug script para encontrar el problema del servidor
const express = require('express');
const cors = require('cors');

console.log('🚀 Iniciando debug del servidor...');

try {
  console.log('✅ Express cargado');
  const app = express();
  
  console.log('✅ App creada');
  
  // Middleware básico
  app.use(cors());
  app.use(express.json());
  
  console.log('✅ Middleware básico configurado');
  
  // Cargar rutas una por una para detectar errores
  try {
    console.log('📋 Cargando adminRoutes...');
    const adminRoutes = require('./routes/adminRoutes');
    console.log('✅ adminRoutes cargado');
  } catch (error) {
    console.error('❌ Error en adminRoutes:', error.message);
  }
  
  try {
    console.log('📋 Cargando sellerRoutes...');
    const sellerRoutes = require('./routes/sellerRoutes');
    console.log('✅ sellerRoutes cargado');
  } catch (error) {
    console.error('❌ Error en sellerRoutes:', error.message);
  }
  
  try {
    console.log('📋 Cargando serviciosRoutes...');
    const serviciosRoutes = require('./routes/serviciosRoutes');
    console.log('✅ serviciosRoutes cargado');
  } catch (error) {
    console.error('❌ Error en serviciosRoutes:', error.message);
  }
  
  try {
    console.log('📋 Cargando empresaRoutes...');
    const empresaRoutes = require('./routes/empresaRoutes');
    console.log('✅ empresaRoutes cargado');
  } catch (error) {
    console.error('❌ Error en empresaRoutes:', error.message);
  }
  
  try {
    console.log('📋 Cargando carouselRoutes...');
    const carouselRoutes = require('./routes/carouselRoutes');
    console.log('✅ carouselRoutes cargado');
  } catch (error) {
    console.error('❌ Error en carouselRoutes:', error.message);
  }
  
  try {
    console.log('📋 Cargando authRoutes...');
    const authRoutes = require('./routes/authRoutes');
    console.log('✅ authRoutes cargado');
  } catch (error) {
    console.error('❌ Error en authRoutes:', error.message);
  }
  
  try {
    console.log('📋 Cargando favoritesRoutes...');
    const favoritesRoutes = require('./routes/favoritesRoutes');
    console.log('✅ favoritesRoutes cargado');
  } catch (error) {
    console.error('❌ Error en favoritesRoutes:', error.message);
  }
  
  try {
    console.log('📋 Cargando ordersRoutes...');
    const ordersRoutes = require('./routes/ordersRoutes');
    console.log('✅ ordersRoutes cargado');
  } catch (error) {
    console.error('❌ Error en ordersRoutes:', error.message);
  }
  
  try {
    console.log('📋 Cargando middleware...');
    const authMiddleware = require('./middleware/authMiddleware');
    const { requireRoleId } = require('./middleware/roleMiddleware');
    console.log('✅ Middleware cargado');
  } catch (error) {
    console.error('❌ Error en middleware:', error.message);
  }
  
  try {
    console.log('📋 Cargando DB...');
    const { connection } = require('./db/DB');
    console.log('✅ DB cargada');
  } catch (error) {
    console.error('❌ Error en DB:', error.message);
  }
  
  console.log('🎉 Todas las dependencias cargadas correctamente');
  
} catch (error) {
  console.error('💥 Error fatal:', error);
  console.error('Stack:', error.stack);
}