const { pool } = require('../db/pool');
const connection = {
  query(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params).then(([rows]) => cb(null, rows)).catch(err => cb(err));
  },
  end(cb){ if (cb) cb(); }
};

// Script para crear la tabla de organización de cargos
const createOrganizacionTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS organizacion_cargos (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nombre_cargo VARCHAR(100) NOT NULL,
      descripcion TEXT,
      nivel_jerarquico INT NOT NULL,
      foto VARCHAR(255),
      activo BOOLEAN DEFAULT TRUE,
      orden_en_nivel INT DEFAULT 0,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const insertDefaultQuery = `
    INSERT IGNORE INTO organizacion_cargos (nombre_cargo, descripcion, nivel_jerarquico, orden_en_nivel) VALUES
    ('Gerencia General', 'Dirección ejecutiva y toma de decisiones estratégicas', 1, 1),
    ('Gerente de Ventas', 'Supervisión del equipo de ventas y estrategias comerciales', 2, 1),
    ('Gerente de Administración', 'Gestión administrativa y recursos humanos', 2, 2),
    ('Vendedor Senior', 'Ventas especializadas y atención a clientes corporativos', 3, 1),
    ('Vendedor', 'Atención al cliente y ventas generales', 3, 2),
    ('Administrativo', 'Tareas administrativas y soporte general', 3, 3),
    ('Atención al Cliente', 'Servicio post-venta y soporte técnico', 4, 1),
    ('Logística', 'Gestión de inventario y distribución', 4, 2)
  `;

  console.log('Creando tabla organizacion_cargos...');
  
  connection.query(createTableQuery, (err, result) => {
    if (err) {
      console.error('Error al crear tabla organizacion_cargos:', err);
      process.exit(1);
    }
    
    console.log('Tabla organizacion_cargos creada exitosamente');
    
    // Insertar datos por defecto
    connection.query(insertDefaultQuery, (err2, result2) => {
      if (err2) {
        console.error('Error al insertar datos por defecto:', err2);
        process.exit(1);
      }
      
      console.log('Datos por defecto de organización insertados exitosamente');
      console.log('Estructura organizacional configurada correctamente');
      
      connection.end();
      process.exit(0);
    });
  });
};

// Ejecutar el script
createOrganizacionTable();