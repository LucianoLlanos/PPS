const mysql = require('mysql2/promise');

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '12345678',
  database: 'atilio_marola'
};

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Conectado a MySQL');

    const createTable = `
      CREATE TABLE IF NOT EXISTS solicitudes_servicio_detalle (
        idDetalle INT AUTO_INCREMENT PRIMARY KEY,
        idSolicitud INT NOT NULL,
        productoTipo ENUM('bombas','tanques','filtros_industriales','articulos_solares','motores') NULL,
        distanciaKm DECIMAL(10,2) NULL,
        provincia ENUM('tucuman','catamarca','santiago_del_estero','salta') NULL,
        fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_solicitud (idSolicitud),
        CONSTRAINT fk_sol_detalle_solicitud FOREIGN KEY (idSolicitud)
          REFERENCES solicitudes_servicio_postventa(idSolicitud)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await connection.execute(createTable);
    // Si la tabla ya existía sin columna provincia, agregarla
    const [cols] = await connection.execute("SHOW COLUMNS FROM solicitudes_servicio_detalle LIKE 'provincia'");
    if (cols.length === 0) {
      await connection.execute("ALTER TABLE solicitudes_servicio_detalle ADD COLUMN provincia ENUM('tucuman','catamarca','santiago_del_estero','salta') NULL AFTER distanciaKm");
      console.log('🛠️  Columna provincia agregada a solicitudes_servicio_detalle');
    }
    console.log('✅ Tabla solicitudes_servicio_detalle lista');
  } catch (err) {
    console.error('❌ Error creando tabla detalle:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

run();
