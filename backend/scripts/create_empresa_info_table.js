const { pool } = require('../db/pool');
const connection = {
  query(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params).then(([rows]) => cb(null, rows)).catch(err => cb(err));
  },
  end(cb){ if (cb) cb(); }
};

// Script para crear la tabla de información de la empresa
const createEmpresaInfoTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS empresa_info (
      id INT PRIMARY KEY AUTO_INCREMENT,
      vision TEXT,
      mision TEXT,
      composicion TEXT,
      archivo_pdf VARCHAR(255),
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      actualizado_por VARCHAR(100)
    )
  `;

  const insertDefaultQuery = `
    INSERT INTO empresa_info (vision, mision, composicion, actualizado_por) 
    SELECT 
      'Nuestra visión es ser la empresa líder en nuestro sector, brindando productos y servicios de calidad excepcional.',
      'Nuestra misión es satisfacer las necesidades de nuestros clientes a través de soluciones innovadoras y un servicio personalizado.',
      'Nuestra empresa está compuesta por un equipo profesional dedicado:\n\n• Gerencia General\n• Departamento de Ventas\n• Departamento de Administración\n• Atención al Cliente\n• Logística y Distribución',
      'Sistema'
    WHERE NOT EXISTS (SELECT 1 FROM empresa_info LIMIT 1)
  `;

  console.log('Creando tabla empresa_info...');
  
  connection.query(createTableQuery, (err, result) => {
    if (err) {
      console.error('Error al crear tabla empresa_info:', err);
      process.exit(1);
    }
    
    console.log('Tabla empresa_info creada exitosamente');
    
    // Insertar datos por defecto si la tabla está vacía
    connection.query(insertDefaultQuery, (err2, result2) => {
      if (err2) {
        console.error('Error al insertar datos por defecto:', err2);
        process.exit(1);
      }
      
      console.log('Datos por defecto insertados exitosamente');
      console.log('Tabla empresa_info configurada correctamente');
      
      connection.end();
      process.exit(0);
    });
  });
};

// Ejecutar el script
createEmpresaInfoTable();