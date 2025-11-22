const { pool } = require('../db/pool');
const connection = {
  query(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params).then(([rows]) => cb(null, rows)).catch(err => cb(err));
  },
  end(cb){ if (cb) cb(); }
};

const queries = [
  // Crear tabla de banners compatible con el repositorio (`banners_carousel`)
  `CREATE TABLE IF NOT EXISTS banners_carousel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255),
    descripcion TEXT,
    imagen VARCHAR(255),
    enlace VARCHAR(255),
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS roles (
    idRol INT PRIMARY KEY,
    nombreRol VARCHAR(100)
  ) ENGINE=InnoDB;`,

  // ensure some default roles exist (1=Cliente,2=Vendedor,3=Admin)
  `INSERT INTO roles (idRol, nombreRol)
    SELECT 1, 'Cliente' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE idRol = 1);`,
  `INSERT INTO roles (idRol, nombreRol)
    SELECT 2, 'Vendedor' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE idRol = 2);`,
  `INSERT INTO roles (idRol, nombreRol)
    SELECT 3, 'Admin' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM roles WHERE idRol = 3);`,

  `CREATE TABLE IF NOT EXISTS stock_sucursal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idSucursal INT,
    idProducto INT,
    stockDisponible INT DEFAULT 0
  ) ENGINE=InnoDB;`,
];

function runQueries(i = 0) {
  if (i >= queries.length) {
    console.log('All init queries executed');
    connection.end();
    return;
  }
  const q = queries[i];
  connection.query(q, (err, res) => {
    if (err) {
      console.error('Error executing query:', err.sqlMessage || err);
      // continue to next
    } else {
      console.log('Query OK');
    }
    runQueries(i + 1);
  });
}

runQueries();
