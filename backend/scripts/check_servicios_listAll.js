const path = require('path');
// Ejecutar desde la carpeta backend: `node scripts/check_servicios_listAll.js`
const { Database } = require('../core/database');
const { ServicioRepository } = require('../repositories/ServicioRepository');

(async function main(){
  const db = new Database();
  const repo = new ServicioRepository(db);
  try {
    const rows = await repo.listAll();
    console.log('Consulta OK. Filas obtenidas:', Array.isArray(rows) ? rows.length : typeof rows);
    // Mostrar algunas filas (limitado)
    console.log(rows && rows.slice ? rows.slice(0,5) : rows);
  } catch (err) {
    console.error('Error al ejecutar listAll():', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exitCode = 2;
  }
})();
