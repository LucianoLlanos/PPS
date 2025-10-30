const { connection } = require('../db/DB');
const path = require('path');
const fs = require('fs');

// Obtener información de la empresa
const obtenerInfoEmpresa = (req, res) => {
  const query = 'SELECT * FROM empresa_info ORDER BY fecha_actualizacion DESC LIMIT 1';
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener información de la empresa:', err);
      return res.status(500).json({ error: 'Error al obtener información de la empresa' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'No hay información de la empresa configurada' });
    }
    
    res.json(results[0]);
  });
};

// Actualizar información de la empresa (solo admin)
const actualizarInfoEmpresa = (req, res) => {
  const { vision, mision, composicion } = req.body;
  const usuario = req.user ? `${req.user.nombre} ${req.user.apellido}` : 'Admin';
  
  // Manejar archivo PDF si se subió uno
  let archivoPdf = null;
  if (req.file) {
    archivoPdf = req.file.filename;
  }
  
  // Verificar si existe un registro
  connection.query('SELECT * FROM empresa_info LIMIT 1', (err, results) => {
    if (err) {
      console.error('Error al verificar información existente:', err);
      return res.status(500).json({ error: 'Error al verificar información existente' });
    }
    
    let query, params;
    
    if (results.length === 0) {
      // Insertar nuevo registro
      query = `INSERT INTO empresa_info (vision, mision, composicion, archivo_pdf, actualizado_por) 
               VALUES (?, ?, ?, ?, ?)`;
      params = [vision, mision, composicion, archivoPdf, usuario];
    } else {
      // Actualizar registro existente
      if (archivoPdf) {
        // Eliminar archivo anterior si existe
        const archivoAnterior = results[0].archivo_pdf;
        if (archivoAnterior) {
          const rutaAnterior = path.join(__dirname, '..', 'uploads', archivoAnterior);
          fs.unlink(rutaAnterior, (unlinkErr) => {
            if (unlinkErr) console.log('No se pudo eliminar archivo anterior:', unlinkErr.message);
          });
        }
        
        query = `UPDATE empresa_info SET vision = ?, mision = ?, composicion = ?, 
                 archivo_pdf = ?, actualizado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
                 WHERE id = ?`;
        params = [vision, mision, composicion, archivoPdf, usuario, results[0].id];
      } else {
        // No actualizar archivo_pdf si no se subió uno nuevo
        query = `UPDATE empresa_info SET vision = ?, mision = ?, composicion = ?, 
                 actualizado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
                 WHERE id = ?`;
        params = [vision, mision, composicion, usuario, results[0].id];
      }
    }
    
    connection.query(query, params, (err2, result) => {
      if (err2) {
        console.error('Error al actualizar información de la empresa:', err2);
        return res.status(500).json({ error: 'Error al actualizar información de la empresa' });
      }
      
      res.json({ 
        mensaje: 'Información de la empresa actualizada exitosamente',
        archivoPdf: archivoPdf || results[0]?.archivo_pdf || null
      });
    });
  });
};

// Obtener archivo PDF de la empresa
const obtenerArchivoPdf = (req, res) => {
  connection.query('SELECT archivo_pdf FROM empresa_info ORDER BY fecha_actualizacion DESC LIMIT 1', (err, results) => {
    if (err) {
      console.error('Error al obtener archivo PDF:', err);
      return res.status(500).json({ error: 'Error al obtener archivo PDF' });
    }
    
    if (results.length === 0 || !results[0].archivo_pdf) {
      return res.status(404).json({ error: 'No hay archivo PDF disponible' });
    }
    
    const nombreArchivo = results[0].archivo_pdf;
    const rutaArchivo = path.join(__dirname, '..', 'uploads', nombreArchivo);
    
    // Verificar si el archivo existe
    fs.access(rutaArchivo, fs.constants.F_OK, (err) => {
      if (err) {
        console.error('Archivo PDF no encontrado:', err);
        return res.status(404).json({ error: 'Archivo PDF no encontrado' });
      }
      
      // Servir el archivo
      res.sendFile(rutaArchivo);
    });
  });
};

// Eliminar archivo PDF
const eliminarArchivoPdf = (req, res) => {
  const usuario = req.user ? `${req.user.nombre} ${req.user.apellido}` : 'Admin';
  
  connection.query('SELECT * FROM empresa_info ORDER BY fecha_actualizacion DESC LIMIT 1', (err, results) => {
    if (err) {
      console.error('Error al obtener información de la empresa:', err);
      return res.status(500).json({ error: 'Error al obtener información de la empresa' });
    }
    
    if (results.length === 0 || !results[0].archivo_pdf) {
      return res.status(404).json({ error: 'No hay archivo PDF para eliminar' });
    }
    
    const nombreArchivo = results[0].archivo_pdf;
    const rutaArchivo = path.join(__dirname, '..', 'uploads', nombreArchivo);
    
    // Eliminar archivo del sistema de archivos
    fs.unlink(rutaArchivo, (unlinkErr) => {
      if (unlinkErr) {
        console.log('No se pudo eliminar archivo físico:', unlinkErr.message);
      }
      
      // Actualizar base de datos para remover referencia al archivo
      connection.query(
        'UPDATE empresa_info SET archivo_pdf = NULL, actualizado_por = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
        [usuario, results[0].id],
        (err2) => {
          if (err2) {
            console.error('Error al actualizar base de datos:', err2);
            return res.status(500).json({ error: 'Error al eliminar referencia del archivo' });
          }
          
          res.json({ mensaje: 'Archivo PDF eliminado exitosamente' });
        }
      );
    });
  });
};

// ========== FUNCIONES PARA ORGANIZACIÓN DE CARGOS ==========

// Obtener toda la estructura organizacional
const obtenerOrganizacion = (req, res) => {
  const query = `
    SELECT id, nombre_cargo, descripcion, nivel_jerarquico, foto, orden_en_nivel, activo
    FROM organizacion_cargos 
    WHERE activo = TRUE 
    ORDER BY nivel_jerarquico ASC, orden_en_nivel ASC
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener organización:', err);
      return res.status(500).json({ error: 'Error al obtener estructura organizacional' });
    }
    
    // Agrupar por nivel jerárquico
    const organizacionPorNiveles = {};
    results.forEach(cargo => {
      const nivel = cargo.nivel_jerarquico;
      if (!organizacionPorNiveles[nivel]) {
        organizacionPorNiveles[nivel] = [];
      }
      organizacionPorNiveles[nivel].push(cargo);
    });
    
    res.json(organizacionPorNiveles);
  });
};

// Crear nuevo cargo
const crearCargo = (req, res) => {
  const { nombre_cargo, descripcion, nivel_jerarquico, orden_en_nivel } = req.body;
  
  if (!nombre_cargo || !nivel_jerarquico) {
    return res.status(400).json({ error: 'Nombre del cargo y nivel jerárquico son obligatorios' });
  }
  
  // Manejar foto si se subió
  let foto = null;
  if (req.file) {
    foto = req.file.filename;
  }
  
  const query = `
    INSERT INTO organizacion_cargos (nombre_cargo, descripcion, nivel_jerarquico, foto, orden_en_nivel)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  connection.query(
    query, 
    [nombre_cargo, descripcion, nivel_jerarquico, foto, orden_en_nivel || 0], 
    (err, result) => {
      if (err) {
        console.error('Error al crear cargo:', err);
        return res.status(500).json({ error: 'Error al crear cargo' });
      }
      
      res.json({ 
        mensaje: 'Cargo creado exitosamente', 
        id: result.insertId,
        foto: foto
      });
    }
  );
};

// Actualizar cargo existente
const actualizarCargo = (req, res) => {
  const { id } = req.params;
  const { nombre_cargo, descripcion, nivel_jerarquico, orden_en_nivel } = req.body;
  
  if (!nombre_cargo || !nivel_jerarquico) {
    return res.status(400).json({ error: 'Nombre del cargo y nivel jerárquico son obligatorios' });
  }
  
  // Obtener información actual del cargo
  connection.query('SELECT * FROM organizacion_cargos WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al buscar cargo:', err);
      return res.status(500).json({ error: 'Error al buscar cargo' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Cargo no encontrado' });
    }
    
    const cargoActual = results[0];
    let foto = cargoActual.foto;
    
    // Si se subió nueva foto, eliminar la anterior y usar la nueva
    if (req.file) {
      // Eliminar foto anterior si existe
      if (cargoActual.foto) {
        const rutaAnterior = path.join(__dirname, '..', 'uploads', cargoActual.foto);
        fs.unlink(rutaAnterior, (unlinkErr) => {
          if (unlinkErr) console.log('No se pudo eliminar foto anterior:', unlinkErr.message);
        });
      }
      foto = req.file.filename;
    }
    
    const query = `
      UPDATE organizacion_cargos 
      SET nombre_cargo = ?, descripcion = ?, nivel_jerarquico = ?, foto = ?, orden_en_nivel = ?, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    connection.query(
      query, 
      [nombre_cargo, descripcion, nivel_jerarquico, foto, orden_en_nivel || 0, id], 
      (err2) => {
        if (err2) {
          console.error('Error al actualizar cargo:', err2);
          return res.status(500).json({ error: 'Error al actualizar cargo' });
        }
        
        res.json({ 
          mensaje: 'Cargo actualizado exitosamente',
          foto: foto
        });
      }
    );
  });
};

// Eliminar cargo
const eliminarCargo = (req, res) => {
  const { id } = req.params;
  
  // Obtener información del cargo antes de eliminarlo
  connection.query('SELECT * FROM organizacion_cargos WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al buscar cargo:', err);
      return res.status(500).json({ error: 'Error al buscar cargo' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Cargo no encontrado' });
    }
    
    const cargo = results[0];
    
    // Eliminar foto si existe
    if (cargo.foto) {
      const rutaFoto = path.join(__dirname, '..', 'uploads', cargo.foto);
      fs.unlink(rutaFoto, (unlinkErr) => {
        if (unlinkErr) console.log('No se pudo eliminar foto:', unlinkErr.message);
      });
    }
    
    // Eliminar registro de la base de datos
    connection.query('DELETE FROM organizacion_cargos WHERE id = ?', [id], (err2) => {
      if (err2) {
        console.error('Error al eliminar cargo:', err2);
        return res.status(500).json({ error: 'Error al eliminar cargo' });
      }
      
      res.json({ mensaje: 'Cargo eliminado exitosamente' });
    });
  });
};

// Obtener foto de un cargo
const obtenerFotoCargo = (req, res) => {
  const { id } = req.params;
  
  connection.query('SELECT foto FROM organizacion_cargos WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener foto del cargo:', err);
      return res.status(500).json({ error: 'Error al obtener foto' });
    }
    
    if (results.length === 0 || !results[0].foto) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }
    
    const nombreArchivo = results[0].foto;
    const rutaArchivo = path.join(__dirname, '..', 'uploads', nombreArchivo);
    
    // Verificar si el archivo existe
    fs.access(rutaArchivo, fs.constants.F_OK, (err) => {
      if (err) {
        console.error('Archivo de foto no encontrado:', err);
        return res.status(404).json({ error: 'Archivo de foto no encontrado' });
      }
      
      // Servir el archivo
      res.sendFile(rutaArchivo);
    });
  });
};

module.exports = {
  obtenerInfoEmpresa,
  actualizarInfoEmpresa,
  obtenerArchivoPdf,
  eliminarArchivoPdf,
  obtenerOrganizacion,
  crearCargo,
  actualizarCargo,
  eliminarCargo,
  obtenerFotoCargo
};