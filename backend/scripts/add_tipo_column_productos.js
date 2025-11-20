// Script para agregar columna 'tipo' a la tabla productos
// Uso: node backend/scripts/add_tipo_column_productos.js
const { Database } = require('../core/database');
(async () => {
  const db = new Database();
  try {
    console.log('Agregando columna tipo a productos si no existe...');
    await db.query("ALTER TABLE productos ADD COLUMN tipo VARCHAR(100) NULL AFTER nombre;");
    console.log('Columna tipo agregada.');
    process.exit(0);
  } catch (e) {
    if (e && e.message && e.message.includes('Duplicate column name')) {
      console.log('La columna tipo ya existe, nada que hacer.');
      process.exit(0);
    }
    console.error('Error agregando columna tipo:', e);\n    process.exit(1);
  }
})();