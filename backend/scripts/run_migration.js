const { pool } = require('../db/pool');
const connection = {
    query(sql, params, cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        pool.query(sql, params).then(([rows]) => cb(null, rows)).catch(err => cb(err));
    },
    end(cb){ if (cb) cb(); }
};
const fs = require('fs');
const path = require('path');

// Leer y ejecutar el script SQL
const sqlScript = fs.readFileSync(path.join(__dirname, 'add_multiple_images.sql'), 'utf8');

// Dividir el script en statements individuales
const statements = sqlScript
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log('Ejecutando migración para múltiples imágenes...');

// Ejecutar cada statement
statements.forEach((statement, index) => {
    connection.query(statement, (err, results) => {
        if (err) {
            console.error(`Error en statement ${index + 1}:`, err.message);
        } else {
            console.log(`Statement ${index + 1} ejecutado correctamente`);
        }
        
        // Si es el último statement, cerrar la conexión
        if (index === statements.length - 1) {
            console.log('Migración completada');
            process.exit(0);
        }
    });
});