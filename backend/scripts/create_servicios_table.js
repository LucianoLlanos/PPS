const mysql = require('mysql2/promise');

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '12345678',
  database: 'atilio_marola'
};

async function createServiciosTable() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Conectado a MySQL');

    // Crear tabla solicitudes_servicio
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS solicitudes_servicio (
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
      );
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Tabla solicitudes_servicio creada exitosamente');

    // Insertar algunos datos de ejemplo
    const insertExamples = `
      INSERT INTO solicitudes_servicio 
      (idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida) 
      VALUES 
      (1, 'instalacion', 'Instalación de bomba de agua de 1HP en casa particular', 'Av. San Martin 1234, La Plata', '221-5555555', '2025-10-20', '14:00:00'),
      (1, 'mantenimiento', 'Mantenimiento preventivo de sistema solar instalado el año pasado', 'Calle 7 entre 50 y 51, La Plata', '221-5555555', '2025-10-22', '10:00:00')
      ON DUPLICATE KEY UPDATE idSolicitud = idSolicitud;
    `;

    try {
      await connection.execute(insertExamples);
      console.log('✅ Datos de ejemplo insertados');
    } catch (err) {
      console.log('ℹ️ Los datos de ejemplo ya existen o hay un error:', err.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

createServiciosTable();