const mysql = require('mysql2/promise');

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '12345678',
  database: 'atilio_marola'
};

async function updateServiciosTable() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Conectado a MySQL');

    // Primero, verificar si la tabla existe y su estructura
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'solicitudes_servicio'
    `);

    if (tables.length > 0) {
      console.log('La tabla solicitudes_servicio existe. Verificando estructura...');
      
      // Mostrar estructura actual
      const [columns] = await connection.execute(`
        DESCRIBE solicitudes_servicio
      `);
      
      console.log('Estructura actual:');
      columns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type}`);
      });

      // Actualizar el ENUM para tipoServicio
      try {
        await connection.execute(`
          ALTER TABLE solicitudes_servicio 
          MODIFY COLUMN tipoServicio ENUM('instalacion', 'mantenimiento', 'garantia') NOT NULL
        `);
        console.log('✅ Campo tipoServicio actualizado exitosamente');
      } catch (err) {
        console.log('⚠️ Error al actualizar tipoServicio:', err.message);
      }

    } else {
      console.log('La tabla no existe. Creándola...');
      
      // Crear tabla nueva con la estructura correcta
      const createTableQuery = `
        CREATE TABLE solicitudes_servicio (
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
      console.log('✅ Tabla solicitudes_servicio creada exitosamente');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

updateServiciosTable();