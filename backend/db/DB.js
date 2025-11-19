const mysql = require('mysql2');

// Creamos la conexión a la base de datos

// IMPORTANTE CAMBIAR HOST, USER Y PASSWORD SI EN SU COMPUTADORA TIENEN OTRO
// VERIFICAR EN MYSQL WORKBENCH
// VERIFICAR QUE LA DATABASE SE LLAME IGUAL

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DB || 'atilio_marola',
});

// Mensaje de error por si falla la conexión
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Base de datos MySQL conectada');
  }
});

module.exports = { connection };

