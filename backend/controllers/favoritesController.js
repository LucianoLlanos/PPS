const { connection } = require('../db/DB');

// Obtener favoritos del usuario
const getUserFavorites = (req, res) => {
  const idUsuario = req.user.idUsuario;
  console.log('📋 Obteniendo favoritos para usuario:', idUsuario);

  const query = `
    SELECT 
      f.id as favoriteId,
      p.idProducto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.imagen,
      p.stockTotal as stock,
      GROUP_CONCAT(pi.imagen ORDER BY pi.orden) AS imagenes
    FROM user_favorites f
    INNER JOIN productos p ON f.idProducto = p.idProducto
    LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id
    WHERE f.idUsuario = ?
    GROUP BY f.id, p.idProducto, p.nombre, p.descripcion, p.precio, p.imagen, p.stockTotal
    ORDER BY f.created_at DESC
  `;

  connection.query(query, [idUsuario], (err, results) => {
    if (err) {
      console.error('❌ Error obteniendo favoritos:', err);
      return res.status(500).json({ message: 'Error del servidor', error: err.message });
    }

    // Convertir campo imagenes (string) a array y aplicar fallback a imagen legacy
    const processed = (results || []).map(r => {
      const imgs = r.imagenes ? r.imagenes.split(',') : [];
      const finalImgs = imgs.length > 0 ? imgs : (r.imagen ? [r.imagen] : []);
      return { ...r, imagenes: finalImgs };
    });

    console.log('✅ Favoritos obtenidos:', processed.length);
    res.json(processed);
  });
};

// Agregar producto a favoritos
const addToFavorites = (req, res) => {
  const idUsuario = req.user.idUsuario;
  const { idProducto } = req.body;

  console.log('➕ Intentando agregar a favoritos:', { idUsuario, idProducto, body: req.body });

  if (!idProducto) {
    console.log('❌ ID del producto no proporcionado');
    return res.status(400).json({ message: 'ID del producto requerido' });
  }

  // Verificar que el producto existe
  const checkProductQuery = 'SELECT idProducto FROM productos WHERE idProducto = ?';
  
  connection.query(checkProductQuery, [idProducto], (err, results) => {
    if (err) {
      console.error('Error verificando producto:', err);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Agregar a favoritos
    const insertQuery = 'INSERT INTO user_favorites (idUsuario, idProducto) VALUES (?, ?)';
    
    connection.query(insertQuery, [idUsuario, idProducto], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log('⚠️ Producto ya está en favoritos');
          return res.status(400).json({ message: 'El producto ya está en favoritos' });
        }
        console.error('❌ Error agregando favorito:', err);
        return res.status(500).json({ message: 'Error del servidor' });
      }

      console.log('✅ Producto agregado a favoritos exitosamente, ID:', result.insertId);
      res.status(201).json({ 
        message: 'Producto agregado a favoritos',
        favoriteId: result.insertId
      });
    });
  });
};

// Quitar producto de favoritos
const removeFromFavorites = (req, res) => {
  const idUsuario = req.user.idUsuario;
  const { idProducto } = req.params;

  console.log('➖ Intentando eliminar de favoritos:', { idUsuario, idProducto });

  const deleteQuery = 'DELETE FROM user_favorites WHERE idUsuario = ? AND idProducto = ?';
  
  connection.query(deleteQuery, [idUsuario, idProducto], (err, result) => {
    if (err) {
      console.error('❌ Error eliminando favorito:', err);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    if (result.affectedRows === 0) {
      console.log('⚠️ Favorito no encontrado para eliminar');
      return res.status(404).json({ message: 'Favorito no encontrado' });
    }

    console.log('✅ Producto eliminado de favoritos exitosamente');
    res.json({ message: 'Producto eliminado de favoritos' });
  });
};

// Verificar si un producto es favorito del usuario
const isFavorite = (req, res) => {
  const idUsuario = req.user.idUsuario;
  const { idProducto } = req.params;

  const query = 'SELECT id FROM user_favorites WHERE idUsuario = ? AND idProducto = ?';
  
  connection.query(query, [idUsuario, idProducto], (err, results) => {
    if (err) {
      console.error('Error verificando favorito:', err);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    res.json({ isFavorite: results.length > 0 });
  });
};

module.exports = {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  isFavorite
};