const mysql = require('mysql2/promise');

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '12345678',
  database: 'atilio_marola'
};

async function checkTables() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Conectado a MySQL');

    // Mostrar todas las tablas relacionadas con servicios
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE '%servic%'
    `);
    
    console.log('Tablas relacionadas con servicios:');
    tables.forEach(table => {
      console.log(`- ${Object.values(table)[0]}`);
    });

    // Verificar la estructura de la tabla existente
    if (tables.length > 0) {
      const tableName = Object.values(tables[0])[0];
      console.log(`\nEstructura de la tabla ${tableName}:`);
      
      const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
      columns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
      });
    }

    // Verificar si podemos usar una tabla diferente
    console.log('\nCreando nueva tabla: solicitudes_servicio_postventa');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS solicitudes_servicio_postventa (
        idSolicitud INT AUTO_INCREMENT PRIMARY KEY,
        idUsuario INT NOT NULL,
        tipoServicio ENUM('instalacion', 'mantenimiento', 'garantia') NOT NULL,
        descripcion TEXT NOT NULL,
        direccion VARCHAR(500) NOT NULL,
        telefono VARCHAR(20),
        fechaSolicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
        fechaPreferida DATE,
        horaPreferida TIME,
        estado ENUM('pendiente', 'confirmado', 'en_proceso', 'completado', 'cancelado') DEFAULT 'pendiente',
        observacionesAdmin TEXT,
        fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
      )
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Tabla solicitudes_servicio_postventa creada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

checkTables();