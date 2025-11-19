const { pool } = require('../db/pool');
const connection = {
  query(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params).then(([rows]) => cb(null, rows)).catch(err => cb(err));
  },
  end(cb){ if (cb) cb(); }
};

const queries = [
  `CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    stock INT DEFAULT 0,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255),
    items TEXT,
    total DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS carousel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    caption TEXT,
    link VARCHAR(255),
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`,

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
