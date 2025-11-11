const { connection } = require('../db/DB');
const multer = require('multer');
const path = require('path');

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'carousel-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Obtener todos los banners activos para mostrar en el carrusel público
const obtenerBannersPublicos = (req, res) => {
  console.log('🔍 Solicitando banners públicos...');
  const query = `
    SELECT id, titulo, descripcion, imagen, enlace, orden 
    FROM banners_carousel 
    WHERE activo = true 
    ORDER BY orden ASC, fecha_creacion DESC
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error obteniendo banners públicos:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    console.log('✅ Banners públicos obtenidos:', results.length);
    res.json(results);
  });
};

// Obtener todos los banners para administración
const obtenerTodosBanners = (req, res) => {
  console.log('🔍 Admin solicitando todos los banners...');
  const query = `
    SELECT * FROM banners_carousel 
    ORDER BY orden ASC, fecha_creacion DESC
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error obteniendo todos los banners:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    console.log('✅ Todos los banners obtenidos para admin:', results.length);
    res.json(results);
  });
};

// Crear nuevo banner
const crearBanner = (req, res) => {
  const { titulo, descripcion, enlace, orden, activo } = req.body;
  const imagen = req.file ? req.file.filename : null;

  if (!titulo || !imagen) {
    return res.status(400).json({ error: 'Título e imagen son requeridos' });
  }

  const query = `
    INSERT INTO banners_carousel (titulo, descripcion, imagen, enlace, orden, activo)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    titulo,
    descripcion || null,
    imagen,
    enlace || null,
    parseInt(orden) || 0,
    activo === 'true' || activo === true
  ];

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error('Error creando banner:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    res.status(201).json({
      message: 'Banner creado exitosamente',
      id: result.insertId
    });
  });
};

// Actualizar banner existente
const actualizarBanner = (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, enlace, orden, activo } = req.body;
  const nuevaImagen = req.file ? req.file.filename : null;

  if (!titulo) {
    return res.status(400).json({ error: 'Título es requerido' });
  }

  // Si hay nueva imagen, incluirla en la actualización
  let query, values;
  
  if (nuevaImagen) {
    query = `
      UPDATE banners_carousel 
      SET titulo = ?, descripcion = ?, imagen = ?, enlace = ?, orden = ?, activo = ?
      WHERE id = ?
    `;
    values = [
      titulo,
      descripcion || null,
      nuevaImagen,
      enlace || null,
      parseInt(orden) || 0,
      activo === 'true' || activo === true,
      id
    ];
  } else {
    query = `
      UPDATE banners_carousel 
      SET titulo = ?, descripcion = ?, enlace = ?, orden = ?, activo = ?
      WHERE id = ?
    `;
    values = [
      titulo,
      descripcion || null,
      enlace || null,
      parseInt(orden) || 0,
      activo === 'true' || activo === true,
      id
    ];
  }

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error('Error actualizando banner:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Banner no encontrado' });
    }

    res.json({ message: 'Banner actualizado exitosamente' });
  });
};

// Eliminar banner
const eliminarBanner = (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM banners_carousel WHERE id = ?';
  
  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error eliminando banner:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Banner no encontrado' });
    }

    res.json({ message: 'Banner eliminado exitosamente' });
  });
};

// Cambiar estado activo/inactivo
const cambiarEstadoBanner = (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  const query = 'UPDATE banners_carousel SET activo = ? WHERE id = ?';
  
  connection.query(query, [activo, id], (err, result) => {
    if (err) {
      console.error('Error cambiando estado del banner:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Banner no encontrado' });
    }

    res.json({ message: 'Estado del banner actualizado exitosamente' });
  });
};

// Reordenar banners
const reordenarBanners = (req, res) => {
  const { banners } = req.body; // Array de { id, orden }

  if (!Array.isArray(banners)) {
    return res.status(400).json({ error: 'Se requiere un array de banners' });
  }

  // Actualizar el orden de cada banner
  const promises = banners.map(banner => {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE banners_carousel SET orden = ? WHERE id = ?';
      connection.query(query, [banner.orden, banner.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  });

  Promise.all(promises)
    .then(() => {
      res.json({ message: 'Orden de banners actualizado exitosamente' });
    })
    .catch(err => {
      console.error('Error reordenando banners:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    });
};

module.exports = {
  obtenerBannersPublicos,
  obtenerTodosBanners,
  crearBanner,
  actualizarBanner,
  eliminarBanner,
  cambiarEstadoBanner,
  reordenarBanners,
  upload
};