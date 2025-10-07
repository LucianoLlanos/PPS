const { connection } = require('../db/DB');
const bcrypt = require('bcryptjs');

// This script will:
// 1) create a backup table usuarios_passwords_backup (if not exists)
// 2) find usuarios where password does not look like a bcrypt hash
// 3) insert backup rows and update usuario.password with bcrypt(hash)

const isProbablyHashed = (pwd) => {
  if (!pwd || typeof pwd !== 'string') return false;
  // bcrypt hashes typically start with $2a$ or $2b$ and are 60 chars
  return pwd.startsWith('$2a$') || pwd.startsWith('$2b$') || pwd.startsWith('$2y$');
};

const run = async () => {
  console.log('Creando tabla de backup si no existe...');
  const createSQL = `
    CREATE TABLE IF NOT EXISTS usuarios_passwords_backup (
      id INT AUTO_INCREMENT PRIMARY KEY,
      idUsuario INT,
      old_password TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  connection.query(createSQL, (err) => {
    if (err) return console.error('Error creando tabla backup', err);

    connection.query('SELECT idUsuario, password FROM usuarios', (err2, rows) => {
      if (err2) return console.error('Error leyendo usuarios', err2);
      const toProcess = rows.filter(r => !isProbablyHashed(r.password));
      if (toProcess.length === 0) return console.log('No se encontraron contraseñas sin hash.');
      console.log('A hashear', toProcess.length, 'contraseñas...');

      const processOne = (i) => {
        if (i >= toProcess.length) return console.log('Proceso completado');
        const u = toProcess[i];
        const hashed = bcrypt.hashSync(u.password, 10);
        // insert backup then update
        connection.query('INSERT INTO usuarios_passwords_backup (idUsuario, old_password) VALUES (?, ?)', [u.idUsuario, u.password], (err3) => {
          if (err3) return console.error('Error backup', err3);
          connection.query('UPDATE usuarios SET password = ? WHERE idUsuario = ?', [hashed, u.idUsuario], (err4) => {
            if (err4) return console.error('Error actualizar usuario', err4);
            console.log('Hasheado usuario', u.idUsuario);
            processOne(i+1);
          });
        });
      };
      processOne(0);
    });
  });
};

run();
