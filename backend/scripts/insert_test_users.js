const { pool } = require('../db/pool');
const connection = {
  query(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params).then(([rows]) => cb(null, rows)).catch(err => cb(err));
  },
  end(cb){ if (cb) cb(); }
};
const bcrypt = require('bcryptjs');

const users = [
  {
    nombre: 'Admin',
    apellido: 'Local',
    email: 'admin@example.com',
    password: 'admin123',
    idRol: 3,
  },
  {
    nombre: 'Vendedor',
    apellido: 'Local',
    email: 'vendedor@example.com',
    password: 'vendedor123',
    idRol: 2,
  },
];

function insertUser(u, cb) {
  connection.query('SELECT * FROM usuarios WHERE email = ?', [u.email], (err, results) => {
    if (err) return cb(err);
    if (results && results.length > 0) {
      console.log(`Usuario ya existe: ${u.email}`);
      return cb(null, { existed: true });
    }
    const hashed = bcrypt.hashSync(u.password, 10);
    connection.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, idRol) VALUES (?, ?, ?, ?, ?)',
      [u.nombre, u.apellido, u.email, hashed, u.idRol],
      (err2, result) => {
        if (err2) return cb(err2);
        console.log(`Usuario creado: ${u.email} (id ${result.insertId})`);
        cb(null, { created: true, id: result.insertId });
      }
    );
  });
}

(function run() {
  let i = 0;
  const next = () => {
    if (i >= users.length) {
      console.log('Done');
      connection.end();
      return;
    }
    insertUser(users[i], (err) => {
      if (err) console.error('Error al insertar usuario:', err);
      i += 1;
      next();
    });
  };
  next();
})();
