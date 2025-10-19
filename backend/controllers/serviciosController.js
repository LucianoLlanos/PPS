const db = require('../db/DB');

// Obtener todas las solicitudes de servicio (para admin)
const getSolicitudesServicio = (req, res) => {
  const query = `
    SELECT 
      s.*,
      u.nombre,
      u.apellido,
      u.email
    FROM solicitudes_servicio_postventa s
    JOIN usuarios u ON s.idUsuario = u.idUsuario
    ORDER BY s.fechaCreacion DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener solicitudes de servicio:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json(results);
  });
};

// Obtener solicitudes de servicio de un usuario específico
const getSolicitudesUsuario = (req, res) => {
  const idUsuario = req.user.idUsuario; // Obtener del token JWT

  const query = `
    SELECT * FROM solicitudes_servicio_postventa 
    WHERE idUsuario = ?
    ORDER BY fechaCreacion DESC
  `;  db.query(query, [idUsuario], (err, results) => {
    if (err) {
      console.error('Error al obtener solicitudes del usuario:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json(results);
  });
};

// Crear nueva solicitud de servicio
const crearSolicitudServicio = (req, res) => {
  const idUsuario = req.user.idUsuario; // Obtener del token JWT
  const { tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida } = req.body;

  // Validaciones
  if (!tipoServicio || !descripcion || !direccion) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios: tipoServicio, descripcion, direccion' 
    });
  }

  if (descripcion.length > 500) {
    return res.status(400).json({ 
      error: 'La descripción no puede exceder 500 caracteres' 
    });
  }

  const tiposValidos = ['instalacion', 'mantenimiento', 'garantia'];
  if (!tiposValidos.includes(tipoServicio)) {
    return res.status(400).json({ 
      error: 'Tipo de servicio no válido' 
    });
  }

  const query = `
    INSERT INTO solicitudes_servicio_postventa 
    (idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error al crear solicitud de servicio:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    res.status(201).json({
      message: 'Solicitud de servicio creada exitosamente',
      idSolicitud: result.insertId
    });
  });
};

// Actualizar estado de solicitud (para admin)
const actualizarEstadoSolicitud = (req, res) => {
  const { idSolicitud } = req.params;
  const { estado, observacionesAdmin } = req.body;

  const estadosValidos = ['pendiente', 'confirmado', 'en_proceso', 'completado', 'cancelado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ 
      error: 'Estado no válido' 
    });
  }

  const query = `
    UPDATE solicitudes_servicio_postventa 
    SET estado = ?, observacionesAdmin = ?, fechaActualizacion = NOW()
    WHERE idSolicitud = ?
  `;

  db.query(query, [estado, observacionesAdmin, idSolicitud], (err, result) => {
    if (err) {
      console.error('Error al actualizar solicitud:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({ message: 'Solicitud actualizada exitosamente' });
  });
};

// Obtener tipos de servicios disponibles
const getTiposServicio = (req, res) => {
  const tipos = [
    { 
      value: 'instalacion', 
      label: 'Instalación de producto', 
      descripcion: 'Instalación profesional de productos adquiridos' 
    },
    { 
      value: 'mantenimiento', 
      label: 'Mantenimiento', 
      descripcion: 'Mantenimiento preventivo y revisión técnica' 
    },
    { 
      value: 'garantia', 
      label: 'Arreglo de un producto por garantía', 
      descripcion: 'Reparación de productos bajo garantía' 
    }
  ];

  res.json(tipos);
};

module.exports = {
  getSolicitudesServicio,
  getSolicitudesUsuario,
  crearSolicitudServicio,
  actualizarEstadoSolicitud,
  getTiposServicio
};