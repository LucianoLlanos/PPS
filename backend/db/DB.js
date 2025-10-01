const mysql = require('mysql2');

//creamos la conexión a la base de datos

//IMPORTANTE CAMBIAR HOST, USER Y PASSWORD SI EN SU COMPUTADORA TIENEN OTRO
// VERIFICAR EN MYSQL WORKBENCH
// VERIFICAR QUE LA DATABASE SE LLAME IGUAL

const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'atilio_marola',
});

//mensaje de error por si falla la conexión
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Base de datos MySQL conectada');
  }
});

module.exports = { connection };
