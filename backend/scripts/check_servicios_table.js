const mysql = require('mysql2/promise');

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '12345678',
  database: 'atilio_marola'
};

async function checkServiciosTable() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Conectado a MySQL');

    // Describir tabla solicitudes_servicio_postventa (nombre real en el esquema)
    const [columns] = await connection.execute('DESCRIBE solicitudes_servicio_postventa');
    console.log('Estructura de solicitudes_servicio_postventa:');
    console.table(columns);

    // Contar registros
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM solicitudes_servicio_postventa');
    console.log('Total de servicios:', count[0].total);

    // Mostrar algunos registros de ejemplo
    const [rows] = await connection.execute('SELECT * FROM solicitudes_servicio_postventa LIMIT 5');
    console.log('Servicios de ejemplo:');
    console.table(rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

checkServiciosTable();