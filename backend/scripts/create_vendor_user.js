const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Luciano1234',
  database: 'atilio_marola'
});

async function createVendorUser() {
  try {
    // Verificar si ya existe un usuario vendedor
    const [existingUsers] = await connection.promise().execute(
      'SELECT u.idUsuario, u.nombre, u.apellido, u.usuario FROM usuarios u WHERE u.idRol = 2'
    );

    if (existingUsers.length > 0) {
      console.log('Ya existen usuarios vendedores:');
      existingUsers.forEach(user => {
        console.log(`- ${user.nombre} ${user.apellido} (${user.usuario})`);
      });
      return;
    }

    // Crear usuario vendedor
    const hashedPassword = await bcrypt.hash('vendedor123', 10);
    
    const [result] = await connection.promise().execute(
      'INSERT INTO usuarios (nombre, apellido, usuario, password, email, telefono, idRol) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Juan', 'Vendedor', 'vendedor', hashedPassword, 'vendedor@atiliomarola.com', '123456789', 2]
    );

    console.log('Usuario vendedor creado exitosamente:');
    console.log('- Usuario: vendedor');
    console.log('- Contraseña: vendedor123');
    console.log('- ID:', result.insertId);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    connection.end();
  }
}

createVendorUser();