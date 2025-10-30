const { connection } = require('../db/DB');
const bcrypt = require('bcryptjs');

// USUARIOS
const listarUsuarios = (req, res) => {
  // Incluir datos de clientes (direccion/telefono) cuando existan para que el frontend pueda mostrarlos en la edición
  const query = `SELECT u.*, r.nombreRol, c.direccion, c.telefono FROM usuarios u JOIN roles r ON u.idRol = r.idRol LEFT JOIN clientes c ON c.idUsuario = u.idUsuario`;
  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener usuarios' });
    res.json(results);
  });
};

const crearUsuario = (req, res) => {
  const { nombre, apellido, email, password, idRol, direccion, telefono } = req.body;
  if (!nombre || !apellido || !email || !password || !idRol) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  // Validar email único
  connection.query('SELECT * FROM usuarios WHERE email=?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al validar email' });
    if (results.length > 0) return res.status(409).json({ error: 'El email ya está registrado' });
    const hashedPwd = bcrypt.hashSync(password, 10);
    const query =
      'INSERT INTO usuarios (nombre, apellido, email, password, idRol) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [nombre, apellido, email, hashedPwd, idRol], (err2, result) => {
      if (err2) return res.status(500).json({ error: 'Error al crear usuario' });
      const newUserId = result.insertId;
      // Si el rol es Cliente (1), crear también la fila en clientes con direccion/telefono opcionales
      if (Number(idRol) === 1) {
        connection.query(
          'INSERT INTO clientes (idUsuario, direccion, telefono) VALUES (?, ?, ?)',
          [newUserId, direccion || null, telefono || null],
          (errCli) => {
            if (errCli) {
              // Intentar borrar el usuario creado para no dejar datos inconsistentes
              connection.query('DELETE FROM usuarios WHERE idUsuario=?', [newUserId], () => {
                return res
                  .status(500)
                  .json({ error: 'Error al crear registro de cliente, usuario no creado' });
              });
            } else {
              registrarHistorial(
                'usuarios',
                newUserId,
                'crear',
                email,
                `Usuario cliente creado: ${nombre} ${apellido}`
              );
              return res.json({ mensaje: 'Usuario creado', id: newUserId });
            }
          }
        );
      } else {
        registrarHistorial(
          'usuarios',
          newUserId,
          'crear',
          email,
          `Usuario creado: ${nombre} ${apellido}`
        );
        return res.json({ mensaje: 'Usuario creado', id: newUserId });
      }
    });
  });
};

const actualizarUsuario = (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, email, password, idRol, direccion, telefono } = req.body;
  // Validar existencia
  connection.query('SELECT * FROM usuarios WHERE idUsuario=?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al buscar usuario' });
    if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    // Si no se envía password en el body, conservar la existente
    const currentPassword = results[0].password;
    const pwdToUse =
      typeof password !== 'undefined' && password !== null && password !== ''
        ? bcrypt.hashSync(password, 10)
        : currentPassword;
    const query =
      'UPDATE usuarios SET nombre=?, apellido=?, email=?, password=?, idRol=? WHERE idUsuario=?';
    connection.query(query, [nombre, apellido, email, pwdToUse, idRol, id], (err2, result) => {
      if (err2) return res.status(500).json({ error: 'Error al actualizar usuario' });

      // Si el rol es Cliente, asegurar que exista/actualizar la fila en clientes con direccion/telefono
      if (Number(idRol) === 1) {
        connection.query('SELECT * FROM clientes WHERE idUsuario=?', [id], (errC, rowsC) => {
          if (errC) return res.status(500).json({ error: 'Error al buscar datos de cliente' });
          if (rowsC && rowsC.length > 0) {
            connection.query(
              'UPDATE clientes SET direccion=?, telefono=? WHERE idUsuario=?',
              [direccion || null, telefono || null, id],
              (errU) => {
                if (errU)
                  return res.status(500).json({ error: 'Error al actualizar datos de cliente' });
                registrarHistorial(
                  'usuarios',
                  id,
                  'actualizar',
                  email,
                  `Usuario cliente actualizado: ${nombre} ${apellido}`
                );
                return res.json({ mensaje: 'Usuario actualizado' });
              }
            );
          } else {
            connection.query(
              'INSERT INTO clientes (idUsuario, direccion, telefono) VALUES (?, ?, ?)',
              [id, direccion || null, telefono || null],
              (errI) => {
                if (errI)
                  return res.status(500).json({ error: 'Error al crear registro de cliente' });
                registrarHistorial(
                  'usuarios',
                  id,
                  'actualizar',
                  email,
                  `Usuario cliente actualizado/creado: ${nombre} ${apellido}`
                );
                return res.json({ mensaje: 'Usuario actualizado' });
              }
            );
          }
        });
      } else {
        // Si no es cliente, solo registrar historial y responder
        registrarHistorial(
          'usuarios',
          id,
          'actualizar',
          email,
          `Usuario actualizado: ${nombre} ${apellido}`
        );
        return res.json({ mensaje: 'Usuario actualizado' });
      }
    });
  });
};

const eliminarUsuario = (req, res) => {
  const { id } = req.params;
  connection.query('SELECT * FROM usuarios WHERE idUsuario=?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al buscar usuario' });
    if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const email = results[0].email;
    connection.query('DELETE FROM usuarios WHERE idUsuario=?', [id], (err2, result) => {
      if (err2) return res.status(500).json({ error: 'Error al eliminar usuario' });
      registrarHistorial('usuarios', id, 'eliminar', email, `Usuario eliminado`);
      res.json({ mensaje: 'Usuario eliminado' });
    });
  });
};
// SUCURSALES
const listarSucursales = (req, res) => {
  connection.query('SELECT * FROM sucursales', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener sucursales' });
    res.json(results);
  });
};

// CLIENTES
const listarClientes = (req, res) => {
  const query = `SELECT c.*, u.nombre, u.apellido, u.email FROM clientes c JOIN usuarios u ON c.idUsuario = u.idUsuario`;
  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener clientes' });
    res.json(results);
  });
};

// Ver un cliente por idCliente
const verCliente = (req, res) => {
  const { id } = req.params;
  connection.query(
    'SELECT c.*, u.nombre, u.apellido, u.email FROM clientes c JOIN usuarios u ON c.idUsuario = u.idUsuario WHERE c.idCliente = ?',
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al obtener cliente' });
      if (!rows || rows.length === 0)
        return res.status(404).json({ error: 'Cliente no encontrado' });
      res.json(rows[0]);
    }
  );
};

// Actualizar datos de cliente (direccion, telefono)
const actualizarCliente = (req, res) => {
  const { id } = req.params;
  const { direccion, telefono } = req.body;
  connection.query('SELECT * FROM clientes WHERE idCliente = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al buscar cliente' });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    connection.query(
      'UPDATE clientes SET direccion = ?, telefono = ? WHERE idCliente = ?',
      [direccion || null, telefono || null, id],
      (err2) => {
        if (err2) return res.status(500).json({ error: 'Error al actualizar cliente' });
        registrarHistorial('clientes', id, 'actualizar', null, `Cliente actualizado: ${id}`);
        res.json({ mensaje: 'Cliente actualizado' });
      }
    );
  });
};

// SERVICIOS POSTVENTA
const listarServicios = (req, res) => {
  connection.query('SELECT * FROM servicios_postventa', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener servicios' });
    res.json(results);
  });
};

// HISTORIAL DE CAMBIOS
const registrarHistorial = (tabla, idRegistro, accion, usuario, descripcion) => {
  const query =
    'INSERT INTO historial_cambios (tabla, idRegistro, accion, usuario, descripcion) VALUES (?, ?, ?, ?, ?)';
  connection.query(query, [tabla, idRegistro, accion, usuario, descripcion], (err) => {
    if (err) console.error('Error al registrar historial:', err);
  });
};

// PRODUCTOS
const listarProductos = (req, res) => {
  const query = `SELECT idProducto, nombre, descripcion, precio, stockTotal AS stock, imagen FROM productos`;
  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener productos' });
    res.json(results);
  });
};

const crearProducto = (req, res) => {
  console.log('[DEBUG] Datos recibidos:', req.body);
  console.log('[DEBUG] Archivos recibidos:', req.files ? req.files.map(f => f.filename) : 'No hay archivos');
  
  const { nombre, descripcion, precio, stockTotal } = req.body;
  
  // Validación más específica
  if (!nombre || nombre.trim() === '') {
    console.log('[ERROR] Nombre faltante o vacío');
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  if (!precio || isNaN(precio) || Number(precio) <= 0) {
    console.log('[ERROR] Precio inválido:', precio);
    return res.status(400).json({ error: 'El precio debe ser un número mayor a 0' });
  }
  
  // Manejar múltiples imágenes subidas
  const imagenes = req.files ? req.files.map(file => file.filename) : [];
  console.log('[DEBUG] Imágenes procesadas:', imagenes);
  
  // sucursales opcion: array de ids de sucursales a las que asignar el producto
  // Si viene como string JSON, parsearlo; si no, usar como array o default vacío
  let sucursalesSelected = req.body.sucursales || [];
  if (typeof sucursalesSelected === 'string') {
    try {
      sucursalesSelected = JSON.parse(sucursalesSelected);
    } catch (e) {
      console.log('[ERROR] Error parseando sucursales JSON:', e.message);
      sucursalesSelected = [];
    }
  }
  
  console.log('[DEBUG] Sucursales procesadas:', sucursalesSelected);
  
  // Crear producto sin imagen en la tabla principal (mantener compatibilidad)
  const query =
    'INSERT INTO productos (nombre, descripcion, precio, stockTotal, imagen) VALUES (?, ?, ?, ?, ?)';
  const imagenPrincipal = imagenes.length > 0 ? imagenes[0] : null;
  
  connection.query(query, [nombre, descripcion, precio, stockTotal, imagenPrincipal], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al crear producto' });
    const idProducto = result.insertId;

    // Insertar todas las imágenes en la tabla producto_imagenes
    const insertarImagenes = (callback) => {
      if (imagenes.length === 0) {
        callback();
        return;
      }

      let insertados = 0;
      imagenes.forEach((imagen, index) => {
        connection.query(
          'INSERT INTO producto_imagenes (producto_id, imagen, orden) VALUES (?, ?, ?)',
          [idProducto, imagen, index],
          (err) => {
            if (err) {
              console.log('[ERROR] Error insertando imagen:', err);
              return res.status(500).json({ error: 'Error al guardar imágenes' });
            }
            insertados++;
            if (insertados === imagenes.length) {
              callback();
            }
          }
        );
      });
    };

    insertarImagenes(() => {
      // Continúa con la lógica de sucursales
      connection.query('SELECT idSucursal FROM sucursales', (err2, sucursalesAll) => {
        if (err2) return res.status(500).json({ error: 'Error al obtener sucursales' });

        let targets = [];
        if (Array.isArray(sucursalesSelected) && sucursalesSelected.length > 0) {
          // Usar solo las sucursales seleccionadas (filtrar por las que existen)
          const existIds = sucursalesAll.map((s) => s.idSucursal);
          targets = sucursalesSelected
            .filter((id) => existIds.includes(Number(id)))
            .map((id) => Number(id));
        } else {
          // Si no se proporcionaron, crear entradas con 0 en todas las sucursales
          targets = sucursalesAll.map((s) => s.idSucursal);
        }

        if (targets.length === 0)
          return res.json({ mensaje: 'Producto creado, sin sucursales disponibles', id: idProducto });

        // Distribuir stockTotal entre las sucursales seleccionadas (si hay stockTotal > 0)
        const total = Number(stockTotal) || 0;
        const n = targets.length;
        const base = Math.floor(total / n);
        let remainder = total % n;

        // Insertar filas en stock_sucursal para cada target
        const insertar = (i) => {
          if (i >= targets.length) {
            return res.json({
              mensaje: `Producto creado con ${imagenes.length} imagen(es) y stock por sucursal inicializado`,
              id: idProducto,
            });
          }
          const idSucursal = targets[i];
          const asignado = total > 0 ? base + (remainder > 0 ? (remainder--, 1) : 0) : 0;
          connection.query(
            'INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, ?)',
            [idSucursal, idProducto, asignado],
            (err3) => {
              if (err3)
                return res.status(500).json({ error: 'Error al crear stock_sucursal inicial' });
              insertar(i + 1);
            }
          );
        };

        insertar(0);
      });
    });
  });
};

// Backfill: crear filas faltantes en stock_sucursal con stock 0 para todas las combinaciones producto-sucursal que faltan
const backfillStockSucursales = (req, res) => {
  // Obtener todos los productos y sucursales
  connection.query('SELECT idProducto FROM productos', (err, productos) => {
    if (err) return res.status(500).json({ error: 'Error al obtener productos' });
    connection.query('SELECT idSucursal FROM sucursales', (err2, sucursales) => {
      if (err2) return res.status(500).json({ error: 'Error al obtener sucursales' });

      const tareas = [];
      productos.forEach((p) => {
        sucursales.forEach((s) => {
          tareas.push([s.idSucursal, p.idProducto]);
        });
      });

      if (tareas.length === 0) return res.json({ mensaje: 'No hay combinaciones para procesar' });

      // Procesar en serie para evitar duplicados por constraints
      const procesar = (i) => {
        if (i >= tareas.length) return res.json({ mensaje: 'Backfill completado' });
        const [idSucursal, idProducto] = tareas[i];
        connection.query(
          'SELECT 1 FROM stock_sucursal WHERE idSucursal=? AND idProducto=?',
          [idSucursal, idProducto],
          (err3, rows) => {
            if (err3) return res.status(500).json({ error: 'Error al comprobar stock_sucursal' });
            if (rows && rows.length > 0) return procesar(i + 1);
            connection.query(
              'INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, 0)',
              [idSucursal, idProducto],
              (err4) => {
                if (err4)
                  return res
                    .status(500)
                    .json({ error: 'Error al insertar stock_sucursal durante backfill' });
                procesar(i + 1);
              }
            );
          }
        );
      };

      procesar(0);
    });
  });
};

// Reconciliar stockTotal de un producto con las filas de stock_sucursal
const reconcileStockProducto = (req, res) => {
  const { idProducto } = req.params;
  // Obtener stockTotal actual
  connection.query(
    'SELECT stockTotal FROM productos WHERE idProducto=?',
    [idProducto],
    (err, prodRows) => {
      if (err) return res.status(500).json({ error: 'Error al obtener producto' });
      if (!prodRows || prodRows.length === 0)
        return res.status(404).json({ error: 'Producto no encontrado' });
      const total = Number(prodRows[0].stockTotal || 0);

      // Obtener filas existentes en stock_sucursal para este producto
      connection.query(
        'SELECT idSucursal, stockDisponible FROM stock_sucursal WHERE idProducto=?',
        [idProducto],
        (err2, rows) => {
          if (err2) return res.status(500).json({ error: 'Error al obtener stock_sucursal' });

          const procesarDistribucion = (targets) => {
            // targets: array of { idSucursal, current }
            // Si no hay targets, crear para todas las sucursales
            if (!targets || targets.length === 0) {
              // crear filas y distribuir
              connection.query('SELECT idSucursal FROM sucursales', (err3, sucursalesAll) => {
                if (err3) return res.status(500).json({ error: 'Error al obtener sucursales' });
                if (!sucursalesAll || sucursalesAll.length === 0)
                  return res.status(400).json({ error: 'No hay sucursales configuradas' });
                const ids = sucursalesAll.map((s) => s.idSucursal);
                // distribuir evenly
                const n = ids.length;
                const base = Math.floor(total / n);
                let rem = total % n;

                connection.beginTransaction((trxErr) => {
                  if (trxErr)
                    return res.status(500).json({ error: 'Error al iniciar transacción' });
                  const insertOne = (i) => {
                    if (i >= ids.length)
                      return connection.commit((errc) => {
                        if (errc)
                          return connection.rollback(() =>
                            res.status(500).json({ error: 'Error al confirmar transacción' })
                          );
                        res.json({ mensaje: 'Stock reconciliado y filas creadas' });
                      });
                    const idSuc = ids[i];
                    const asign = base + (rem > 0 ? (rem--, 1) : 0);
                    connection.query(
                      'INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, ?)',
                      [idSuc, idProducto, asign],
                      (err4) => {
                        if (err4)
                          return connection.rollback(() =>
                            res.status(500).json({ error: 'Error al insertar stock_sucursal' })
                          );
                        insertOne(i + 1);
                      }
                    );
                  };
                  insertOne(0);
                });
              });
              return;
            }

            // Si hay filas existentes, sumar y comparar
            const sum = targets.reduce((a, b) => a + Number(b.stockDisponible || 0), 0);
            if (sum === total) return res.json({ mensaje: 'Stock ya conciliado' });

            // Distribuir:
            connection.beginTransaction((trxErr) => {
              if (trxErr) return res.status(500).json({ error: 'Error al iniciar transacción' });

              const updates = [];
              if (sum === 0) {
                // repartir equitativamente
                const n = targets.length;
                const base = Math.floor(total / n);
                let rem = total % n;
                targets.forEach((t) => {
                  const asign = base + (rem > 0 ? (rem--, 1) : 0);
                  updates.push({ idSucursal: t.idSucursal, asign });
                });
              } else {
                // Escalar proporcionalmente manteniendo ratios
                let assignedTotal = 0;
                targets.forEach((t, idx) => {
                  const frac = Number(t.stockDisponible || 0) / sum;
                  const asign = Math.floor(frac * total);
                  updates.push({ idSucursal: t.idSucursal, asign });
                  assignedTotal += asign;
                });
                // distribuir resto
                let rem = total - assignedTotal;
                let i = 0;
                while (rem > 0 && updates.length > 0) {
                  updates[i % updates.length].asign += 1;
                  rem--;
                  i++;
                }
              }

              // Aplicar updates en serie
              const applyOne = (i) => {
                if (i >= updates.length)
                  return connection.commit((errc) => {
                    if (errc)
                      return connection.rollback(() =>
                        res.status(500).json({ error: 'Error al confirmar transacción' })
                      );
                    res.json({ mensaje: 'Stock reconciliado' });
                  });
                const u = updates[i];
                connection.query(
                  'UPDATE stock_sucursal SET stockDisponible=? WHERE idProducto=? AND idSucursal=?',
                  [u.asign, idProducto, u.idSucursal],
                  (err5) => {
                    if (err5)
                      return connection.rollback(() =>
                        res.status(500).json({ error: 'Error al actualizar stock_sucursal' })
                      );
                    applyOne(i + 1);
                  }
                );
              };

              applyOne(0);
            });
          };

          if (!rows || rows.length === 0) return procesarDistribucion([]);
          // map rows to targets
          const targets = rows.map((r) => ({
            idSucursal: r.idSucursal,
            stockDisponible: r.stockDisponible,
          }));
          procesarDistribucion(targets);
        }
      );
    }
  );
};

const actualizarProducto = (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stockTotal } = req.body;
  console.log('[DEBUG actualizarProducto] id=', id);
  console.log('[DEBUG actualizarProducto] body=', req.body);
  console.log('[DEBUG actualizarProducto] files=', req.files ? req.files.map(f=>f.filename) : 'no files');
  
  // Manejo de múltiples imágenes si vienen en req.files (Multer)
  const nuevasImagenes = req.files ? req.files.map(f => f.filename) : [];

  // Actualizar campos básicos primero
  const baseQuery = 'UPDATE productos SET nombre=?, descripcion=?, precio=?, stockTotal=? WHERE idProducto=?';
  connection.query(baseQuery, [nombre, descripcion, precio, stockTotal, id], (err) => {
    if (err) {
      console.error('[ERROR actualizarProducto] baseQuery err=', err);
      return res.status(500).json({ error: 'Error al actualizar producto' });
    }
    console.log('[DEBUG actualizarProducto] baseQuery OK for id=', id);
    // Manejar eliminación solicitada de imágenes existentes (si viene removeImages en body)
    let removeList = [];
    if (req.body && req.body.removeImages) {
      try {
        removeList = typeof req.body.removeImages === 'string' ? JSON.parse(req.body.removeImages) : req.body.removeImages;
      } catch (e) {
        removeList = [];
      }
    }

    const handleRemoveExisting = (done) => {
      if (!removeList || removeList.length === 0) return done();
      // Borrar filas de producto_imagenes y archivos del disco si existen
      let remCount = 0;
      removeList.forEach((filename) => {
        connection.query('DELETE FROM producto_imagenes WHERE producto_id = ? AND imagen = ?', [id, filename], (errRem) => {
          if (errRem) console.error('[ERROR] al borrar fila imagen DB:', errRem);
          // intentar borrar archivo fisico
          const imgPath = require('path').join(__dirname, '..', 'uploads', filename);
          const fs = require('fs');
          fs.unlink(imgPath, (unlinkErr) => {
            // ignorar errores de unlink (archivo puede no existir)
            remCount++;
            if (remCount === removeList.length) done();
          });
        });
      });
    };

    handleRemoveExisting(() => {
      // Si no hay nuevas imágenes, respondemos ya después de procesar remociones
      if (!nuevasImagenes || nuevasImagenes.length === 0) {
        return res.json({ mensaje: 'Producto actualizado' });
      }

      // Insertar nuevas imágenes en producto_imagenes y actualizar imagen principal
      connection.query('SELECT MAX(orden) AS maxOrden FROM producto_imagenes WHERE producto_id = ?', [id], (err2, rows) => {
        if (err2) return res.status(500).json({ error: 'Error al obtener orden de imágenes' });
        let startOrden = (rows && rows[0] && rows[0].maxOrden != null) ? rows[0].maxOrden + 1 : 0;

        let inserted = 0;
        nuevasImagenes.forEach((img) => {
          connection.query('INSERT INTO producto_imagenes (producto_id, imagen, orden) VALUES (?, ?, ?)', [id, img, startOrden++], (err3) => {
            if (err3) console.error('[ERROR] al insertar imagen:', err3);
            inserted++;
            if (inserted === nuevasImagenes.length) {
              // Actualizar imagen principal en tabla productos al primer archivo nuevo (si se desea)
              const primera = nuevasImagenes[0];
              connection.query('UPDATE productos SET imagen = ? WHERE idProducto = ?', [primera, id], (err4) => {
                if (err4) console.error('[ERROR] al actualizar imagen principal:', err4);
                return res.json({ mensaje: 'Producto actualizado con nuevas imágenes' });
              });
            }
          });
        });
      });
    });
  });
};

const eliminarProducto = (req, res) => {
  const { id } = req.params;
  
  // Primero verificar si el producto existe
  connection.query('SELECT nombre FROM productos WHERE idProducto = ?', [id], (err, prodRows) => {
    if (err) return res.status(500).json({ error: 'Error al buscar producto' });
    if (!prodRows || prodRows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const nombreProducto = prodRows[0].nombre;
    
    // Verificar si el producto tiene pedidos asociados (histórico de ventas)
    connection.query(
      'SELECT COUNT(*) as count FROM detalle_pedido WHERE idProducto = ?', 
      [id], 
      (err, pedidoRows) => {
        if (err) return res.status(500).json({ error: 'Error al verificar pedidos del producto' });
        
        const tienePedidos = pedidoRows[0].count > 0;
        
        if (tienePedidos) {
          return res.status(400).json({ 
            error: 'No se puede eliminar el producto porque tiene pedidos asociados (histórico de ventas). Para mantener la integridad de los datos, considere marcarlo como inactivo o descontinuado en lugar de eliminarlo.' 
          });
        }
        
        // Si no tiene pedidos, proceder con la eliminación
        connection.beginTransaction((trxErr) => {
          if (trxErr) return res.status(500).json({ error: 'Error al iniciar transacción' });
          
          // 1. Eliminar registros de stock_sucursal
          connection.query('DELETE FROM stock_sucursal WHERE idProducto = ?', [id], (err1) => {
            if (err1) {
              return connection.rollback(() => 
                res.status(500).json({ error: 'Error al eliminar stock por sucursal' })
              );
            }
            
            // 2. Eliminar imágenes del producto (producto_imagenes ya tiene CASCADE, pero por si acaso)
            connection.query('DELETE FROM producto_imagenes WHERE producto_id = ?', [id], (err2) => {
              if (err2) {
                return connection.rollback(() => 
                  res.status(500).json({ error: 'Error al eliminar imágenes del producto' })
                );
              }
              
              // 3. Finalmente eliminar el producto
              connection.query('DELETE FROM productos WHERE idProducto = ?', [id], (err3) => {
                if (err3) {
                  return connection.rollback(() => 
                    res.status(500).json({ error: 'Error al eliminar producto' })
                  );
                }
                
                // Confirmar transacción
                connection.commit((commitErr) => {
                  if (commitErr) {
                    return connection.rollback(() => 
                      res.status(500).json({ error: 'Error al confirmar transacción' })
                    );
                  }
                  
                  // Registrar en historial
                  registrarHistorial(
                    'productos', 
                    id, 
                    'eliminar', 
                    null, 
                    `Producto eliminado: ${nombreProducto}`
                  );
                  
                  res.json({ 
                    mensaje: 'Producto eliminado exitosamente',
                    productoEliminado: nombreProducto
                  });
                });
              });
            });
          });
        });
      }
    );
  });
};

// PEDIDOS (VENTAS)
const listarPedidos = (req, res) => {
  // Filtros soportados: idPedido, estado, fecha (YYYY-MM-DD exacta), fechaDesde, fechaHasta, producto (nombre LIKE), usuario (nombre/apellido/email LIKE),
  // totalMin, totalMax, cantidadMin, cantidadMax, priorizarPendientes (1), sort (fecha_asc/fecha_desc)
  const {
    idPedido,
    estado,
    fechaDesde,
    fechaHasta,
    fecha,
    producto,
    usuario,
    totalMin,
    totalMax,
    cantidadMin,
    cantidadMax,
    priorizarPendientes,
    sort,
  } = req.query;

  let sql = `
        SELECT pe.idPedido, u.nombre AS nombreUsuario, u.apellido AS apellidoUsuario, pe.fecha, pe.estado
        FROM pedidos pe
        JOIN clientes c ON pe.idCliente = c.idCliente
        JOIN usuarios u ON c.idUsuario = u.idUsuario
    `;

  const where = [];
  const params = [];

  if (idPedido) {
    where.push('pe.idPedido = ?');
    params.push(idPedido);
  }
  if (estado) {
    where.push('pe.estado = ?');
    params.push(estado);
  }
  // Manejo robusto de fechas:
  // - Si se pasa 'fecha' exacta, usar DATE(pe.fecha) = fecha
  // - Si se pasan both fechaDesde y fechaHasta usar DATE(pe.fecha) BETWEEN fechaDesde AND fechaHasta (inclusive)
  // - Si solo fechaDesde usar DATE(pe.fecha) >= fechaDesde
  // - Si solo fechaHasta usar DATE(pe.fecha) <= fechaHasta
  if (fecha) {
    where.push('DATE(pe.fecha) = ?');
    params.push(fecha);
  } else if (fechaDesde && fechaHasta) {
    where.push('DATE(pe.fecha) BETWEEN ? AND ?');
    params.push(fechaDesde, fechaHasta);
  } else {
    if (fechaDesde) {
      where.push('DATE(pe.fecha) >= ?');
      params.push(fechaDesde);
    }
    if (fechaHasta) {
      where.push('DATE(pe.fecha) <= ?');
      params.push(fechaHasta);
    }
  }

  // Filtrar por producto usando EXISTS en detalle_pedido + productos
  if (producto) {
    where.push(`EXISTS (SELECT 1 FROM detalle_pedido dp JOIN productos pr ON dp.idProducto = pr.idProducto WHERE dp.idPedido = pe.idPedido AND pr.nombre LIKE ?)`);
    params.push('%' + producto + '%');
  }

  // Filtrar por usuario (nombre, apellido o email)
  if (usuario) {
    where.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)');
    params.push('%' + usuario + '%', '%' + usuario + '%', '%' + usuario + '%');
  }

  // Filtrar por total del pedido (subconsulta que suma cantidad * precioUnitario)
  // Aceptar 0 y valores numéricos enviados como strings. Ignorar valores vacíos o no numéricos.
  const parsedTotalMin = typeof totalMin !== 'undefined' && totalMin !== '' ? Number(totalMin) : undefined;
  const parsedTotalMax = typeof totalMax !== 'undefined' && totalMax !== '' ? Number(totalMax) : undefined;
  if (typeof parsedTotalMin !== 'undefined' && !isNaN(parsedTotalMin)) {
    where.push(`(SELECT COALESCE(SUM(dp.cantidad * dp.precioUnitario),0) FROM detalle_pedido dp WHERE dp.idPedido = pe.idPedido) >= ?`);
    params.push(parsedTotalMin);
  }
  if (typeof parsedTotalMax !== 'undefined' && !isNaN(parsedTotalMax)) {
    where.push(`(SELECT COALESCE(SUM(dp.cantidad * dp.precioUnitario),0) FROM detalle_pedido dp WHERE dp.idPedido = pe.idPedido) <= ?`);
    params.push(parsedTotalMax);
  }

  // Filtrar por cantidad total (sum cantidad)
  const parsedCantidadMin = typeof cantidadMin !== 'undefined' && cantidadMin !== '' ? Number(cantidadMin) : undefined;
  const parsedCantidadMax = typeof cantidadMax !== 'undefined' && cantidadMax !== '' ? Number(cantidadMax) : undefined;
  if (typeof parsedCantidadMin !== 'undefined' && !isNaN(parsedCantidadMin)) {
    where.push(`(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedido dp WHERE dp.idPedido = pe.idPedido) >= ?`);
    params.push(parsedCantidadMin);
  }
  if (typeof parsedCantidadMax !== 'undefined' && !isNaN(parsedCantidadMax)) {
    where.push(`(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedido dp WHERE dp.idPedido = pe.idPedido) <= ?`);
    params.push(parsedCantidadMax);
  }

  if (where.length) sql += ' WHERE ' + where.join(' AND ');

  // Ordenamiento: soporta múltiples keys separadas por coma (ej: 'fecha_asc,cantidad_desc')
  const orderClauses = [];
  if (priorizarPendientes === '1') {
    orderClauses.push("CASE WHEN pe.estado = 'Pendiente' THEN 0 ELSE 1 END");
  }

  if (sort) {
    const parts = String(sort).split(',').map(s => s.trim()).filter(Boolean);
    parts.forEach(s => {
      if (s === 'fecha_asc') orderClauses.push('pe.fecha ASC');
      else if (s === 'fecha_desc') orderClauses.push('pe.fecha DESC');
      else if (s === 'cantidad_asc') orderClauses.push("(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedido dp WHERE dp.idPedido = pe.idPedido) ASC");
      else if (s === 'cantidad_desc') orderClauses.push("(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedido dp WHERE dp.idPedido = pe.idPedido) DESC");
    });
  }

  if (orderClauses.length) {
    sql += ' ORDER BY ' + orderClauses.join(', ');
  } else {
    sql += ' ORDER BY pe.fecha DESC';
  }

  connection.query(sql, params, (err, pedidos) => {
    if (err) return res.status(500).json({ error: 'Error al obtener pedidos' });
    if (!pedidos || pedidos.length === 0) return res.json([]);

    // Obtener productos de cada pedido
    const ids = pedidos.map((p) => p.idPedido);
    const placeholders = ids.map(() => '?').join(',');
    const queryDetalles = `
            SELECT dp.idPedido, pr.nombre AS nombreProducto, dp.cantidad, dp.precioUnitario
            FROM detalle_pedido dp
            JOIN productos pr ON dp.idProducto = pr.idProducto
            WHERE dp.idPedido IN (${placeholders})
        `;
    connection.query(queryDetalles, ids, (err2, detalles) => {
      if (err2) return res.status(500).json({ error: 'Error al obtener detalles' });
      // Agrupar productos por pedido
      const pedidosFinal = pedidos.map((p) => {
        const productos = detalles
          .filter((d) => d.idPedido === p.idPedido)
          .map((d) => ({
            nombre: d.nombreProducto,
            cantidad: d.cantidad,
            total: d.cantidad * d.precioUnitario,
          }));
        const total = productos.reduce((acc, prod) => acc + prod.total, 0);
        return { ...p, productos, total };
      });
      res.json(pedidosFinal);
    });
  });
};

const crearPedido = (req, res) => {
  const { idCliente, estado, idSucursalOrigen, productos } = req.body;
  if (
    !idCliente ||
    !estado ||
    !idSucursalOrigen ||
    !productos ||
    !Array.isArray(productos) ||
    productos.length === 0
  ) {
    return res.status(400).json({ error: 'Faltan datos obligatorios o productos no es un array' });
  }

  // Validar que el idCliente (enviado como idUsuario desde frontend) corresponda a un usuario con rol 'Cliente'
  const queryRol = `SELECT r.nombreRol FROM usuarios u JOIN roles r ON u.idRol = r.idRol WHERE u.idUsuario = ?`;
  connection.query(queryRol, [idCliente], (err, rolRes) => {
    if (err) return res.status(500).json({ error: 'Error al validar rol del cliente' });
    if (!rolRes || rolRes.length === 0)
      return res.status(404).json({ error: 'Cliente no encontrado' });
    const nombreRol = (rolRes[0].nombreRol || '').toLowerCase();
    if (nombreRol !== 'cliente')
      return res
        .status(403)
        .json({ error: 'Solo usuarios con rol Cliente pueden registrar pedidos' });

    // Buscar en clientes el idCliente real asociado al idUsuario recibido
    connection.query(
      'SELECT idCliente FROM clientes WHERE idUsuario = ?',
      [idCliente],
      (errCli, cliRows) => {
        if (errCli) return res.status(500).json({ error: 'Error al buscar cliente asociado' });

        const handlePedido = (clienteId) => {
          // Iniciar transacción
          connection.beginTransaction((trxErr) => {
            if (trxErr) return res.status(500).json({ error: 'Error al iniciar transacción' });

            const queryPedido =
              'INSERT INTO pedidos (idCliente, estado, idSucursalOrigen) VALUES (?, ?, ?)';
            connection.query(queryPedido, [clienteId, estado, idSucursalOrigen], (err2, result) => {
              if (err2)
                return connection.rollback(() =>
                  res.status(500).json({ error: 'Error al crear pedido' })
                );
              const idPedido = result.insertId;

              // Procesar productos en serie para insertar detalle y decrementar stocks
              const procesarProducto = (i) => {
                if (i >= productos.length) {
                  // Todo ok, confirmar transacción
                  connection.commit((commitErr) => {
                    if (commitErr)
                      return connection.rollback(() =>
                        res.status(500).json({ error: 'Error al confirmar transacción' })
                      );
                    res.json({ mensaje: 'Pedido creado', idPedido });
                  });
                  return;
                }
                const p = productos[i];
                // Insertar detalle
                const insertDetalle =
                  'INSERT INTO detalle_pedido (idPedido, idProducto, cantidad, precioUnitario) VALUES (?, ?, ?, ?)';
                connection.query(
                  insertDetalle,
                  [idPedido, p.idProducto, p.cantidad, p.precioUnitario || 0],
                  (err3) => {
                    if (err3)
                      return connection.rollback(() =>
                        res.status(500).json({ error: 'Error al insertar detalle de pedido' })
                      );
                    // Decrementar stock en sucursal (asegurando no quedar negativo)
                    const updSucursal =
                      'UPDATE stock_sucursal SET stockDisponible = stockDisponible - ? WHERE idProducto=? AND idSucursal=? AND stockDisponible >= ?';
                    connection.query(
                      updSucursal,
                      [p.cantidad, p.idProducto, idSucursalOrigen, p.cantidad],
                      (err4, updRes) => {
                        if (err4)
                          return connection.rollback(() =>
                            res.status(500).json({ error: 'Error al actualizar stock en sucursal' })
                          );
                        if (!updRes || updRes.affectedRows === 0)
                          return connection.rollback(() =>
                            res.status(400).json({
                              error: `Stock insuficiente para producto ${p.idProducto} en sucursal ${idSucursalOrigen}`,
                            })
                          );
                        // Decrementar stock total en productos
                        connection.query(
                          'UPDATE productos SET stockTotal = stockTotal - ? WHERE idProducto=?',
                          [p.cantidad, p.idProducto],
                          (err5) => {
                            if (err5)
                              return connection.rollback(() =>
                                res
                                  .status(500)
                                  .json({ error: 'Error al actualizar stock total del producto' })
                              );
                            procesarProducto(i + 1);
                          }
                        );
                      }
                    );
                  }
                );
              };

              procesarProducto(0);
            });
          });
        };

        if (cliRows && cliRows.length > 0) {
          handlePedido(cliRows[0].idCliente);
        } else {
          // No existe cliente: crear una fila mínima y obtener su idCliente
          connection.query(
            'INSERT INTO clientes (idUsuario) VALUES (?)',
            [idCliente],
            (errIns, resIns) => {
              if (errIns)
                return res.status(500).json({ error: 'Error al crear registro de cliente' });
              const newClienteId = resIns.insertId;
              handlePedido(newClienteId);
            }
          );
        }
      }
    );
  });
};

// Ver detalle de un pedido
const verDetallePedido = (req, res) => {
  const { id } = req.params;
  const query = `SELECT dp.idPedido, dp.idProducto, p.nombre AS nombreProducto, dp.cantidad, dp.precioUnitario FROM detalle_pedido dp JOIN productos p ON dp.idProducto = p.idProducto WHERE dp.idPedido = ?`;
  connection.query(query, [id], (err, detalles) => {
    if (err) return res.status(500).json({ error: 'Error al obtener detalle del pedido' });
    res.json(detalles);
  });
};

// Eliminar pedido: restaurar stocks y eliminar dentro de transacción
const eliminarPedido = (req, res) => {
  const { id } = req.params;
  connection.beginTransaction((trxErr) => {
    if (trxErr) return res.status(500).json({ error: 'Error al iniciar transacción' });

    connection.query('SELECT * FROM pedidos WHERE idPedido=?', [id], (err, pedidos) => {
      if (err)
        return connection.rollback(() => res.status(500).json({ error: 'Error al buscar pedido' }));
      if (!pedidos || pedidos.length === 0)
        return connection.rollback(() => res.status(404).json({ error: 'Pedido no encontrado' }));

      const pedido = pedidos[0];
      const idSucursalOrigen = pedido.idSucursalOrigen;

      connection.query(
        'SELECT idProducto, cantidad FROM detalle_pedido WHERE idPedido=?',
        [id],
        (err2, detalles) => {
          if (err2)
            return connection.rollback(() =>
              res.status(500).json({ error: 'Error al obtener detalles del pedido' })
            );

          const procesarDetalle = (i) => {
            if (i >= detalles.length) {
              // eliminar detalles y pedido
              connection.query('DELETE FROM detalle_pedido WHERE idPedido=?', [id], (err5) => {
                if (err5)
                  return connection.rollback(() =>
                    res.status(500).json({ error: 'Error al eliminar detalle de pedido' })
                  );
                connection.query('DELETE FROM pedidos WHERE idPedido=?', [id], (err6) => {
                  if (err6)
                    return connection.rollback(() =>
                      res.status(500).json({ error: 'Error al eliminar pedido' })
                    );
                  connection.commit((commitErr) => {
                    if (commitErr)
                      return connection.rollback(() =>
                        res.status(500).json({ error: 'Error al confirmar transacción' })
                      );
                    res.json({ mensaje: 'Pedido eliminado y stock restaurado' });
                  });
                });
              });
              return;
            }
            const d = detalles[i];
            connection.query(
              'UPDATE stock_sucursal SET stockDisponible = stockDisponible + ? WHERE idProducto=? AND idSucursal=?',
              [d.cantidad, d.idProducto, idSucursalOrigen],
              (err3) => {
                if (err3)
                  return connection.rollback(() =>
                    res.status(500).json({ error: 'Error al restaurar stock_sucursal' })
                  );
                connection.query(
                  'UPDATE productos SET stockTotal = stockTotal + ? WHERE idProducto=?',
                  [d.cantidad, d.idProducto],
                  (err4) => {
                    if (err4)
                      return connection.rollback(() =>
                        res.status(500).json({ error: 'Error al restaurar stock total' })
                      );
                    procesarDetalle(i + 1);
                  }
                );
              }
            );
          };

          procesarDetalle(0);
        }
      );
    });
  });
};

// Listar stock por sucursal (incluye nombre del producto y sucursal)
const listarStockSucursal = (req, res) => {
  const query = `
        SELECT ss.idSucursal, ss.idProducto, ss.stockDisponible, p.nombre as nombreProducto, s.nombre as nombreSucursal
        FROM stock_sucursal ss
        JOIN productos p ON ss.idProducto = p.idProducto
        JOIN sucursales s ON ss.idSucursal = s.idSucursal
        ORDER BY ss.idSucursal, p.idProducto
    `;
  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener stock por sucursal' });
    res.json(results);
  });
};

// Actualizar stock de un producto en una sucursal (solo stockDisponible)
const actualizarStockSucursal = (req, res) => {
  const { idSucursal, idProducto } = req.params;
  const { stockDisponible } = req.body;
  if (
    stockDisponible === undefined ||
    isNaN(Number(stockDisponible)) ||
    Number(stockDisponible) < 0
  ) {
    return res.status(400).json({ error: 'stockDisponible inválido' });
  }
  const nuevoStock = Number(stockDisponible);

  connection.beginTransaction((trxErr) => {
    if (trxErr) return res.status(500).json({ error: 'Error al iniciar transacción' });

    // Obtener stock actual
    connection.query(
      'SELECT stockDisponible FROM stock_sucursal WHERE idSucursal=? AND idProducto=?',
      [idSucursal, idProducto],
      (err, rows) => {
        if (err)
          return connection.rollback(() =>
            res.status(500).json({ error: 'Error al buscar stock_sucursal' })
          );
        if (!rows || rows.length === 0)
          return connection.rollback(() =>
            res
              .status(404)
              .json({ error: 'Registro de stock no encontrado para esa sucursal y producto' })
          );
        const actual = Number(rows[0].stockDisponible || 0);
        const delta = nuevoStock - actual;

        // Actualizar stock_sucursal al nuevo valor
        connection.query(
          'UPDATE stock_sucursal SET stockDisponible = ? WHERE idSucursal=? AND idProducto=?',
          [nuevoStock, idSucursal, idProducto],
          (err2) => {
            if (err2)
              return connection.rollback(() =>
                res.status(500).json({ error: 'Error al actualizar stock_sucursal' })
              );

            // Ajustar stockTotal en productos por la diferencia
            if (delta !== 0) {
              connection.query(
                'UPDATE productos SET stockTotal = stockTotal + ? WHERE idProducto=?',
                [delta, idProducto],
                (err3) => {
                  if (err3)
                    return connection.rollback(() =>
                      res
                        .status(500)
                        .json({ error: 'Error al actualizar stock total del producto' })
                    );
                  // Registrar historial (usar idProducto como referencia)
                  registrarHistorial(
                    'stock_sucursal',
                    idProducto,
                    'actualizar',
                    null,
                    `Stock sucursal ${idSucursal} cambiado de ${actual} a ${nuevoStock}`
                  );
                  connection.commit((commitErr) => {
                    if (commitErr)
                      return connection.rollback(() =>
                        res.status(500).json({ error: 'Error al confirmar transacción' })
                      );
                    res.json({
                      mensaje: 'Stock actualizado',
                      idSucursal: Number(idSucursal),
                      idProducto: Number(idProducto),
                      stockDisponible: nuevoStock,
                    });
                  });
                }
              );
            } else {
              // No hay cambio en delta, solo commit
              registrarHistorial(
                'stock_sucursal',
                idProducto,
                'actualizar',
                null,
                `Stock sucursal ${idSucursal} confirmado sin cambios (${actual})`
              );
              connection.commit((commitErr) => {
                if (commitErr)
                  return connection.rollback(() =>
                    res.status(500).json({ error: 'Error al confirmar transacción' })
                  );
                res.json({
                  mensaje: 'Stock actualizado',
                  idSucursal: Number(idSucursal),
                  idProducto: Number(idProducto),
                  stockDisponible: nuevoStock,
                });
              });
            }
          }
        );
      }
    );
  });
};

// Actualizar pedido (por ejemplo cambiar estado)
const actualizarPedido = (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  if (!estado) return res.status(400).json({ error: 'Faltan datos (estado)' });
  connection.query('SELECT * FROM pedidos WHERE idPedido=?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al buscar pedido' });
    if (results.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    connection.query('UPDATE pedidos SET estado=? WHERE idPedido=?', [estado, id], (err2) => {
      if (err2) return res.status(500).json({ error: 'Error al actualizar pedido' });
      registrarHistorial(
        'pedidos',
        id,
        'actualizar',
        results[0].idCliente || null,
        `Estado actualizado a: ${estado}`
      );
      // Si se marca como "Entregado", intentar registrar fecha de entrega si la columna existe
      if (String(estado).toLowerCase() === 'entregado') {
        // Comprobar si la columna fecha_entrega existe en la tabla pedidos
        const colCheck = `SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'fecha_entrega' LIMIT 1`;
        connection.query(colCheck, (errCol, rowsCol) => {
          if (!errCol && rowsCol && rowsCol.length > 0) {
            // Actualizar fecha_entrega a NOW() para este pedido
            connection.query('UPDATE pedidos SET fecha_entrega = NOW() WHERE idPedido = ?', [id], (errUpd) => {
              if (errUpd) console.error('Error al setear fecha_entrega:', errUpd);
              // Responder igual aunque haya error en la columna extra
              return res.json({ mensaje: 'Pedido actualizado' });
            });
          } else {
            return res.json({ mensaje: 'Pedido actualizado' });
          }
        });
      } else {
        res.json({ mensaje: 'Pedido actualizado' });
      }
    });
  });
};

// --------- Analytics de ventas (basado en pedidos con estado 'Entregado')
const ventasSummary = (req, res) => {
  const { fechaDesde, fechaHasta, idSucursal } = req.query;
  // Default últimos 30 días
  const end = fechaHasta || new Date().toISOString().slice(0, 10);
  const start = fechaDesde || (() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10);
  })();

  let sql = `
    SELECT
      COUNT(DISTINCT pe.idPedido) AS pedidos_entregados,
      COALESCE(SUM(dp.cantidad * dp.precioUnitario), 0) AS ingresos_totales,
      COALESCE(SUM(dp.cantidad), 0) AS unidades_vendidas
    FROM pedidos pe
    JOIN detalle_pedido dp ON dp.idPedido = pe.idPedido
    WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ?
  `;
  const params = [start, end];
  if (idSucursal) {
    sql += ' AND pe.idSucursalOrigen = ?';
    params.push(idSucursal);
  }

  connection.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al calcular resumen de ventas' });
    const r = rows && rows[0] ? rows[0] : { pedidos_entregados:0, ingresos_totales:0, unidades_vendidas:0 };
    const aov = (r.pedidos_entregados && Number(r.pedidos_entregados) > 0) ? (Number(r.ingresos_totales) / Number(r.pedidos_entregados)) : 0;
    res.json({ pedidos: Number(r.pedidos_entregados), ingresos: Number(r.ingresos_totales), unidades: Number(r.unidades_vendidas), aov: Number(aov) });
  });
};

const ventasTimeseries = (req, res) => {
  const { fechaDesde, fechaHasta, idSucursal } = req.query;
  const end = fechaHasta || new Date().toISOString().slice(0, 10);
  const start = fechaDesde || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10); })();

  let sql = `
    SELECT DATE(pe.fecha) AS fecha, 
      COUNT(DISTINCT pe.idPedido) AS pedidos,
      COALESCE(SUM(dp.cantidad * dp.precioUnitario),0) AS ingresos,
      COALESCE(SUM(dp.cantidad),0) AS unidades
    FROM pedidos pe
    JOIN detalle_pedido dp ON dp.idPedido = pe.idPedido
    WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ?
    GROUP BY DATE(pe.fecha)
    ORDER BY DATE(pe.fecha) ASC
  `;
  const params = [start, end];
  if (idSucursal) {
    // inject filter by sucursal
    sql = sql.replace("WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ?", "WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ? AND pe.idSucursalOrigen = ?");
    params.push(idSucursal);
  }

  connection.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al calcular series temporales de ventas' });
    res.json(rows.map(r => ({ fecha: r.fecha, pedidos: Number(r.pedidos), ingresos: Number(r.ingresos), unidades: Number(r.unidades) })));
  });
};

const ventasTopProducts = (req, res) => {
  const { fechaDesde, fechaHasta, limit, idSucursal } = req.query;
  const end = fechaHasta || new Date().toISOString().slice(0, 10);
  const start = fechaDesde || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10); })();
  const lim = limit ? Number(limit) : 10;

  let sql = `
    SELECT dp.idProducto, pr.nombre AS nombre, SUM(dp.cantidad) AS cantidad_vendida, SUM(dp.cantidad * dp.precioUnitario) AS ingresos
    FROM detalle_pedido dp
    JOIN pedidos pe ON dp.idPedido = pe.idPedido
    JOIN productos pr ON dp.idProducto = pr.idProducto
    WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ?
    GROUP BY dp.idProducto
    ORDER BY ingresos DESC
    LIMIT ?
  `;
  const params = [start, end, lim];
  if (idSucursal) {
    // add filter to SQL (pe.idSucursalOrigen)
    sql = sql.replace("WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ?", "WHERE pe.estado = 'Entregado' AND DATE(pe.fecha) BETWEEN ? AND ? AND pe.idSucursalOrigen = ?");
    // params become [start, end, idSucursal, lim]
    params.splice(2, 0, idSucursal);
  }

  connection.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener top de productos' });
    res.json(rows.map(r => ({ idProducto: r.idProducto, nombre: r.nombre, cantidad: Number(r.cantidad_vendida), ingresos: Number(r.ingresos) })));
  });
};


module.exports = {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  listarPedidos,
  crearPedido,
  actualizarPedido,
  verDetallePedido,
  eliminarPedido,
  listarStockSucursal,
  actualizarStockSucursal,
  backfillStockSucursales,
  reconcileStockProducto,
  listarSucursales,
  listarClientes,
  verCliente,
  actualizarCliente,
  listarServicios,
  ventasSummary,
  ventasTimeseries,
  ventasTopProducts,
};
