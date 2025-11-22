// Monolithic adminController obsoleto: usar controladores modulares en ./admin/*
const { Database } = require('../core/database');
const bcrypt = require('bcryptjs');
const db = new Database();

// USUARIOS
const listarUsuarios = async (req, res) => {
  try {
    const query = `SELECT u.*, r.nombreRol, c.direccion, c.telefono FROM usuarios u JOIN roles r ON u.idRol = r.idRol LEFT JOIN clientes c ON c.idUsuario = u.idUsuario`;
    const rows = await db.query(query, []);
    return res.json(rows);
  } catch (e) {
    console.error('[listarUsuarios] error', e);
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const crearUsuario = (req, res) => {
  // Controlador obsoleto: migrado a ./admin/*
  return res.status(501).json({ error: 'Controlador obsoleto, usar ./admin/*' });
};
// SUCURSALES
const listarSucursales = async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM sucursales', []);
    return res.json(rows);
  } catch (e) {
    console.error('[listarSucursales] error', e);
    return res.status(500).json({ error: 'Error al obtener sucursales' });
  }
};

// CLIENTES
const listarClientes = async (req, res) => {
  try {
    const query = `SELECT c.*, u.nombre, u.apellido, u.email FROM clientes c JOIN usuarios u ON c.idUsuario = u.idUsuario`;
    const rows = await db.query(query, []);
    return res.json(rows);
  } catch (e) {
    console.error('[listarClientes] error', e);
    return res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

// Ver un cliente por idCliente
const verCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.query('SELECT c.*, u.nombre, u.apellido, u.email FROM clientes c JOIN usuarios u ON c.idUsuario = u.idUsuario WHERE c.idCliente = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    return res.json(rows[0]);
  } catch (e) {
    console.error('[verCliente] error', e);
    return res.status(500).json({ error: 'Error al obtener cliente' });
  }
};

// Actualizar datos de cliente (direccion, telefono)
const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { direccion, telefono } = req.body;
    const rows = await db.query('SELECT * FROM clientes WHERE idCliente = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    await db.query('UPDATE clientes SET direccion = ?, telefono = ? WHERE idCliente = ?', [direccion || null, telefono || null, id]);
    await registrarHistorial('clientes', id, 'actualizar', null, `Cliente actualizado: ${id}`);
    return res.json({ mensaje: 'Cliente actualizado' });
  } catch (e) {
    console.error('[actualizarCliente] error', e);
    return res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

// SERVICIOS POSTVENTA
// La tabla actual en el esquema es `solicitudes_servicio_postventa`.
const listarServicios = async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM solicitudes_servicio_postventa', []);
    return res.json(rows);
  } catch (e) {
    console.error('[listarServicios] error', e);
    return res.status(500).json({ error: 'Error al obtener servicios' });
  }
};

// HISTORIAL DE CAMBIOS
const registrarHistorial = async (tabla, idRegistro, accion, usuario, descripcion) => {
  try {
    const query = 'INSERT INTO historial (tabla, idRegistro, accion, usuario, descripcion) VALUES (?, ?, ?, ?, ?)';
    await db.query(query, [tabla, idRegistro, accion, usuario, descripcion]);
  } catch (e) {
    console.error('Error al registrar historial:', e);
  }
};

// PRODUCTOS
const listarProductos = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.idProducto, p.nombre, p.descripcion, p.precio, p.stockTotal AS stock, p.imagen,
        GROUP_CONCAT(pi.imagen ORDER BY pi.orden) AS imagenes
      FROM productos p
      LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id
      GROUP BY p.idProducto
    `;
    const results = await db.query(query, []);
    const parsed = (results || []).map((r) => {
      const imgs = r.imagenes ? String(r.imagenes).split(',') : [];
      const finalImgs = imgs.length > 0 ? imgs : (r.imagen ? [r.imagen] : []);
      return { ...r, imagenes: finalImgs };
    });
    return res.json(parsed);
  } catch (e) {
    console.error('[listarProductos] error', e);
    return res.status(500).json({ error: 'Error al obtener productos' });
  }
};

const crearProducto = async (req, res) => {
  try {
    console.log('[DEBUG] Datos recibidos:', req.body);
    console.log('[DEBUG] Archivos recibidos:', req.files ? req.files.map(f => f.filename) : 'No hay archivos');
    const { nombre, descripcion, precio, stockTotal } = req.body;
    if (!nombre || nombre.trim() === '') return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!precio || isNaN(precio) || Number(precio) <= 0) return res.status(400).json({ error: 'El precio debe ser un número mayor a 0' });

    const imagenes = req.files ? req.files.map(f => f.filename) : [];
    let sucursalesSelected = req.body.sucursales || [];
    if (typeof sucursalesSelected === 'string') {
      try { sucursalesSelected = JSON.parse(sucursalesSelected); } catch { sucursalesSelected = []; }
    }

    const result = await db.withTransaction(async (conn) => {
      const imagenPrincipal = imagenes.length > 0 ? imagenes[0] : null;
      const [ins] = await conn.query('INSERT INTO productos (nombre, descripcion, precio, stockTotal, imagen) VALUES (?, ?, ?, ?, ?)', [nombre, descripcion, precio, stockTotal, imagenPrincipal]);
      const idProducto = ins.insertId;

      // Insertar imágenes (si las hay)
      if (imagenes.length > 0) {
        let orden = 0;
        for (const imagen of imagenes) {
          await conn.query('INSERT INTO producto_imagenes (producto_id, imagen, orden) VALUES (?, ?, ?)', [idProducto, imagen, orden++]);
        }
      }

      // Obtener sucursales existentes
      const sucursalesAll = await conn.query('SELECT idSucursal FROM sucursales', []);
      const existIds = (sucursalesAll || []).map(s => s.idSucursal);
      let targets = [];
      if (Array.isArray(sucursalesSelected) && sucursalesSelected.length > 0) {
        targets = sucursalesSelected.filter(id => existIds.includes(Number(id))).map(id => Number(id));
      } else {
        targets = existIds;
      }

      if (!targets || targets.length === 0) return { id: idProducto, mensaje: 'Producto creado, sin sucursales disponibles' };

      const total = Number(stockTotal) || 0;
      const n = targets.length;
      const base = Math.floor(total / n);
      let remainder = total % n;

      for (const idSucursal of targets) {
        const asignado = total > 0 ? base + (remainder > 0 ? (remainder--, 1) : 0) : 0;
        await conn.query('INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, ?)', [idSucursal, idProducto, asignado]);
      }

      return { id: idProducto, mensaje: `Producto creado con ${imagenes.length} imagen(es) y stock por sucursal inicializado` };
    });

    res.json(result);
  } catch (e) {
    console.error('[crearProducto] error', e);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// Backfill: crear filas faltantes en stock_sucursal con stock 0 para todas las combinaciones producto-sucursal que faltan
const backfillStockSucursales = async (req, res) => {
  try {
    const productos = await db.query('SELECT idProducto FROM productos', []);
    const sucursales = await db.query('SELECT idSucursal FROM sucursales', []);
    const tareas = [];
    (productos || []).forEach((p) => {
      (sucursales || []).forEach((s) => {
        tareas.push({ idSucursal: s.idSucursal, idProducto: p.idProducto });
      });
    });

    if (tareas.length === 0) return res.json({ mensaje: 'No hay combinaciones para procesar' });

    for (const t of tareas) {
      const rows = await db.query('SELECT 1 as ok FROM stock_sucursal WHERE idSucursal=? AND idProducto=? LIMIT 1', [t.idSucursal, t.idProducto]);
      if (rows && rows.length > 0) continue;
      try {
        await db.query('INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, 0)', [t.idSucursal, t.idProducto]);
      } catch (err) {
        console.warn('[backfillStockSucursales] insert skipped or failed for', t, err);
      }
    }

    return res.json({ mensaje: 'Backfill completado' });
  } catch (e) {
    console.error('[backfillStockSucursales] error', e);
    return res.status(500).json({ error: 'Error en backfill de stock' });
  }
};

// Reconciliar stockTotal de un producto con las filas de stock_sucursal
const reconcileStockProducto = async (req, res) => {
  const { idProducto } = req.params;
  try {
    const prodRows = await db.query('SELECT stockTotal FROM productos WHERE idProducto=?', [idProducto]);
    if (!prodRows || prodRows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    const total = Number(prodRows[0].stockTotal || 0);

    const rows = await db.query('SELECT idSucursal, stockDisponible FROM stock_sucursal WHERE idProducto=?', [idProducto]);
    const procesarDistribucion = async (targets) => {
      if (!targets || targets.length === 0) {
        const sucursalesAll = await db.query('SELECT idSucursal FROM sucursales', []);
        if (!sucursalesAll || sucursalesAll.length === 0) return res.status(400).json({ error: 'No hay sucursales configuradas' });
        const ids = sucursalesAll.map((s) => s.idSucursal);
        const n = ids.length;
        const base = Math.floor(total / n);
        let rem = total % n;

        await db.withTransaction(async (conn) => {
          for (const idSuc of ids) {
            const asign = base + (rem > 0 ? (rem--, 1) : 0);
            await conn.query('INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, ?)', [idSuc, idProducto, asign]);
          }
        });
        return res.json({ mensaje: 'Stock reconciliado y filas creadas' });
      }

      const sum = targets.reduce((a, b) => a + Number(b.stockDisponible || 0), 0);
      if (sum === total) return res.json({ mensaje: 'Stock ya conciliado' });

      const updates = [];
      if (sum === 0) {
        const n = targets.length;
        const base = Math.floor(total / n);
        let rem = total % n;
        targets.forEach((t) => {
          const asign = base + (rem > 0 ? (rem--, 1) : 0);
          updates.push({ idSucursal: t.idSucursal, asign });
        });
      } else {
        let assignedTotal = 0;
        targets.forEach((t) => {
          const frac = Number(t.stockDisponible || 0) / sum;
          const asign = Math.floor(frac * total);
          updates.push({ idSucursal: t.idSucursal, asign });
          assignedTotal += asign;
        });
        let rem = total - assignedTotal;
        let i = 0;
        while (rem > 0 && updates.length > 0) {
          updates[i % updates.length].asign += 1;
          rem--;
          i++;
        }
      }

      await db.withTransaction(async (conn) => {
        for (const u of updates) {
          await conn.query('UPDATE stock_sucursal SET stockDisponible=? WHERE idProducto=? AND idSucursal=?', [u.asign, idProducto, u.idSucursal]);
        }
      });

      return res.json({ mensaje: 'Stock reconciliado' });
    };

    if (!rows || rows.length === 0) return await procesarDistribucion([]);
    const targets = rows.map((r) => ({ idSucursal: r.idSucursal, stockDisponible: r.stockDisponible }));
    return await procesarDistribucion(targets);
  } catch (e) {
    console.error('[reconcileStockProducto] error', e);
    return res.status(500).json({ error: 'Error al reconciliar stock' });
  }
};

const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stockTotal } = req.body;
  console.log('[DEBUG actualizarProducto] id=', id);
  console.log('[DEBUG actualizarProducto] body=', req.body);
  console.log('[DEBUG actualizarProducto] files=', req.files ? req.files.map(f=>f.filename) : 'no files');
  
  // Manejo de múltiples imágenes si vienen en req.files (Multer)
  const nuevasImagenes = req.files ? req.files.map(f => f.filename) : [];

  try {
    // Actualizar campos básicos primero
    const baseQuery = 'UPDATE productos SET nombre=?, descripcion=?, precio=?, stockTotal=? WHERE idProducto=?';
    await db.query(baseQuery, [nombre, descripcion, precio, stockTotal, id]);
    // Manejar eliminación solicitada de imágenes existentes (si viene removeImages en body)
    let removeList = [];
    if (req.body && req.body.removeImages) {
      try {
        removeList = typeof req.body.removeImages === 'string' ? JSON.parse(req.body.removeImages) : req.body.removeImages;
      } catch (e) {
        removeList = [];
      }
    }

    const fs = require('fs').promises;
    const path = require('path');

    if (removeList && removeList.length > 0) {
      for (const filename of removeList) {
        try {
          await db.query('DELETE FROM producto_imagenes WHERE producto_id = ? AND imagen = ?', [id, filename]);
        } catch (errRem) {
          console.warn('[WARN] al borrar fila imagen DB:', errRem);
        }
        try {
          const imgPath = path.join(__dirname, '..', 'uploads', filename);
          await fs.unlink(imgPath).catch(() => {});
        } catch (e) {
          // ignore
        }
      }
      try {
        const rowsSel = await db.query('SELECT imagen FROM producto_imagenes WHERE producto_id = ? ORDER BY orden ASC, id ASC LIMIT 1', [id]);
        const nuevaPrincipal = rowsSel && rowsSel[0] ? rowsSel[0].imagen : null;
        await db.query('UPDATE productos SET imagen = ? WHERE idProducto = ?', [nuevaPrincipal, id]);
      } catch (e) {
        console.warn('[WARN] No se pudo actualizar imagen principal tras eliminar:', e);
      }
    }

    // Si no hay nuevas imágenes, respondemos ya después de procesar remociones
    if (!nuevasImagenes || nuevasImagenes.length === 0) {
      return res.json({ mensaje: 'Producto actualizado' });
    }

    // Insertar nuevas imágenes en producto_imagenes y actualizar imagen principal
    const rows = await db.query('SELECT MAX(orden) AS maxOrden FROM producto_imagenes WHERE producto_id = ?', [id]);
    let startOrden = (rows && rows[0] && rows[0].maxOrden != null) ? rows[0].maxOrden + 1 : 0;
    for (const img of nuevasImagenes) {
      try {
        await db.query('INSERT INTO producto_imagenes (producto_id, imagen, orden) VALUES (?, ?, ?)', [id, img, startOrden++]);
      } catch (e) {
        console.warn('[WARN] al insertar imagen:', e);
      }
    }
    try {
      const primera = nuevasImagenes[0];
      await db.query('UPDATE productos SET imagen = ? WHERE idProducto = ?', [primera, id]);
    } catch (e) {
      console.warn('[WARN] al actualizar imagen principal:', e);
    }
    return res.json({ mensaje: 'Producto actualizado con nuevas imágenes' });
  } catch (e) {
    console.error('[actualizarProducto] error', e);
    return res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const eliminarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const prodRows = await db.query('SELECT nombre FROM productos WHERE idProducto = ?', [id]);
    if (!prodRows || prodRows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    const nombreProducto = prodRows[0].nombre;

    const pedidoRows = await db.query('SELECT COUNT(*) as count FROM detalle_pedidos WHERE idProducto = ?', [id]);
    const tienePedidos = pedidoRows && pedidoRows[0] && pedidoRows[0].count > 0;
    if (tienePedidos) return res.status(400).json({ error: 'No se puede eliminar el producto porque tiene pedidos asociados (histórico de ventas). Para mantener la integridad de los datos, considere marcarlo como inactivo o descontinuado en lugar de eliminarlo.' });

    await db.withTransaction(async (conn) => {
      await conn.query('DELETE FROM stock_sucursal WHERE idProducto = ?', [id]);
      await conn.query('DELETE FROM producto_imagenes WHERE producto_id = ?', [id]);
      await conn.query('DELETE FROM productos WHERE idProducto = ?', [id]);
    });

    registrarHistorial('productos', id, 'eliminar', null, `Producto eliminado: ${nombreProducto}`);
    return res.json({ mensaje: 'Producto eliminado exitosamente', productoEliminado: nombreProducto });
  } catch (e) {
    console.error('[eliminarProducto] error', e);
    return res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

// PEDIDOS (VENTAS)
const listarPedidos = async (req, res) => {
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
        SELECT 
          pe.idPedido, 
          u.nombre AS nombreUsuario, 
          u.apellido AS apellidoUsuario, 
          pe.fechaPedido as fecha, 
          pe.estado,
          COALESCE(pe.total, 0) as total,
          (SELECT COALESCE(SUM(dp.cantidad), 0) 
           FROM detalle_pedidos dp 
           WHERE dp.idPedido = pe.idPedido) as cantidadTotal
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
  // - Si se pasa 'fecha' exacta, usar DATE(fechaPedido) = fecha
  // - Si se pasan both fechaDesde y fechaHasta usar DATE(fechaPedido) BETWEEN fechaDesde AND fechaHasta (inclusive)
  // - Si solo fechaDesde usar DATE(fechaPedido) >= fechaDesde
  // - Si solo fechaHasta usar DATE(fechaPedido) <= fechaHasta
  if (fecha) {
    where.push('DATE(pe.fechaPedido) = ?');
    params.push(fecha);
  } else if (fechaDesde && fechaHasta) {
    where.push('DATE(pe.fechaPedido) BETWEEN ? AND ?');
    params.push(fechaDesde, fechaHasta);
  } else {
    if (fechaDesde) {
      where.push('DATE(pe.fechaPedido) >= ?');
      params.push(fechaDesde);
    }
    if (fechaHasta) {
      where.push('DATE(pe.fechaPedido) <= ?');
      params.push(fechaHasta);
    }
  }

  // Filtrar por producto usando EXISTS en detalle_pedidos + productos
  if (producto) {
    where.push(`EXISTS (SELECT 1 FROM detalle_pedidos dp JOIN productos pr ON dp.idProducto = pr.idProducto WHERE dp.idPedido = pe.idPedido AND pr.nombre LIKE ?)`);
    params.push('%' + producto + '%');
  }

  // Filtrar por usuario (nombre, apellido o email)
  if (usuario) {
    where.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)');
    params.push('%' + usuario + '%', '%' + usuario + '%', '%' + usuario + '%');
  }

  // Filtrar por total del pedido (usar campo total o calcular)
  // Aceptar 0 y valores numéricos enviados como strings. Ignorar valores vacíos o no numéricos.
  const parsedTotalMin = typeof totalMin !== 'undefined' && totalMin !== '' ? Number(totalMin) : undefined;
  const parsedTotalMax = typeof totalMax !== 'undefined' && totalMax !== '' ? Number(totalMax) : undefined;
  if (typeof parsedTotalMin !== 'undefined' && !isNaN(parsedTotalMin)) {
    where.push(`COALESCE(pe.total, (SELECT COALESCE(SUM(dp.cantidad * dp.precioUnitario),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido)) >= ?`);
    params.push(parsedTotalMin);
  }
  if (typeof parsedTotalMax !== 'undefined' && !isNaN(parsedTotalMax)) {
    where.push(`COALESCE(pe.total, (SELECT COALESCE(SUM(dp.cantidad * dp.precioUnitario),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido)) <= ?`);
    params.push(parsedTotalMax);
  }

  // Filtrar por cantidad total (sum cantidad)
  const parsedCantidadMin = typeof cantidadMin !== 'undefined' && cantidadMin !== '' ? Number(cantidadMin) : undefined;
  const parsedCantidadMax = typeof cantidadMax !== 'undefined' && cantidadMax !== '' ? Number(cantidadMax) : undefined;
  if (typeof parsedCantidadMin !== 'undefined' && !isNaN(parsedCantidadMin)) {
    where.push(`(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) >= ?`);
    params.push(parsedCantidadMin);
  }
  if (typeof parsedCantidadMax !== 'undefined' && !isNaN(parsedCantidadMax)) {
    where.push(`(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) <= ?`);
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
      if (s === 'fecha_asc') orderClauses.push('pe.fechaPedido ASC');
      else if (s === 'fecha_desc') orderClauses.push('pe.fechaPedido DESC');
      else if (s === 'cantidad_asc') orderClauses.push("(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) ASC");
      else if (s === 'cantidad_desc') orderClauses.push("(SELECT COALESCE(SUM(dp.cantidad),0) FROM detalle_pedidos dp WHERE dp.idPedido = pe.idPedido) DESC");
    });
  }

  if (orderClauses.length) {
    sql += ' ORDER BY ' + orderClauses.join(', ');
  } else {
    sql += ' ORDER BY pe.fechaPedido DESC';
  }

  try {
    const pedidos = await db.query(sql, params);
    if (!pedidos || pedidos.length === 0) return res.json([]);
    const ids = pedidos.map((p) => p.idPedido);
    const placeholders = ids.map(() => '?').join(',');
    const queryDetalles = `
            SELECT dp.idPedido, pr.nombre AS nombreProducto, dp.cantidad, dp.precioUnitario
            FROM detalle_pedidos dp
            JOIN productos pr ON dp.idProducto = pr.idProducto
            WHERE dp.idPedido IN (${placeholders})
        `;
    const detalles = await db.query(queryDetalles, ids);
    const pedidosFinal = pedidos.map((p) => {
      const productos = detalles
        .filter((d) => d.idPedido === p.idPedido)
        .map((d) => ({ nombre: d.nombreProducto, cantidad: d.cantidad, total: d.cantidad * d.precioUnitario }));
      return { ...p, productos };
    });
    return res.json(pedidosFinal);
  } catch (e) {
    console.error('[listarPedidos] error', e);
    return res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

const crearPedido = (req, res) => {
  const { idCliente, estado, idSucursalOrigen, productos, observaciones, metodoPago } = req.body;
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
  (async () => {
    try {
      // Validación mínima
      if (!idCliente || !estado || !idSucursalOrigen || !productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ error: 'Faltan datos obligatorios o productos no es un array' });
      }

      const result = await db.withTransaction(async (conn) => {
        // Verificar rol del usuario
        const [rolRows] = await conn.query('SELECT r.nombreRol FROM usuarios u JOIN roles r ON u.idRol = r.idRol WHERE u.idUsuario = ?', [idCliente]);
        if (!rolRows || rolRows.length === 0) throw { status: 404, message: 'Cliente no encontrado' };
        const nombreRol = (rolRows[0].nombreRol || '').toLowerCase();
        if (nombreRol !== 'cliente') throw { status: 403, message: 'Solo usuarios con rol Cliente pueden registrar pedidos' };

        // Obtener o crear idCliente real
        const [cliRows] = await conn.query('SELECT idCliente FROM clientes WHERE idUsuario = ?', [idCliente]);
        let clienteId = null;
        if (cliRows && cliRows.length > 0) clienteId = cliRows[0].idCliente;
        else {
          const [ins] = await conn.query('INSERT INTO clientes (idUsuario) VALUES (?)', [idCliente]);
          clienteId = ins.insertId;
        }

        // Comprobar columnas opcionales
        const [rowsCol] = await conn.query("SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'metodoPago' LIMIT 1", []);
        const hasMetodo = rowsCol && rowsCol.length > 0;
        const insertPedidoSql = hasMetodo
          ? 'INSERT INTO pedidos (idCliente, estado, idSucursalOrigen, fechaPedido, observaciones, metodoPago) VALUES (?, ?, ?, NOW(), ?, ?)'
          : 'INSERT INTO pedidos (idCliente, estado, idSucursalOrigen, fechaPedido, observaciones) VALUES (?, ?, ?, NOW(), ?)';
        const paramsPedido = hasMetodo ? [clienteId, estado, idSucursalOrigen, observaciones || null, metodoPago || null] : [clienteId, estado, idSucursalOrigen, observaciones || null];
        const [resInsert] = await conn.query(insertPedidoSql, paramsPedido);
        const idPedido = resInsert.insertId;

        let totalPedido = 0;
        let cantidadTotal = 0;
        for (const p of productos) {
          const precioUnit = Number(p.precioUnitario || p.precio || 0);
          const subtotal = precioUnit * Number(p.cantidad || 0);
          await conn.query('INSERT INTO detalle_pedidos (idPedido, idProducto, cantidad, precioUnitario, subtotal) VALUES (?, ?, ?, ?, ?)', [idPedido, p.idProducto, p.cantidad, precioUnit, subtotal]);
          totalPedido += subtotal;
          cantidadTotal += Number(p.cantidad || 0);

          const [updRes] = await conn.query('UPDATE stock_sucursal SET stockDisponible = stockDisponible - ? WHERE idProducto=? AND idSucursal=? AND stockDisponible >= ?', [p.cantidad, p.idProducto, idSucursalOrigen, p.cantidad]);
          if (!updRes || updRes.affectedRows === 0) throw { status: 400, message: `Stock insuficiente para producto ${p.idProducto} en sucursal ${idSucursalOrigen}` };
          await conn.query('UPDATE productos SET stockTotal = stockTotal - ? WHERE idProducto=?', [p.cantidad, p.idProducto]);
        }

        const [chkRows] = await conn.query("SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'cantidadTotal' LIMIT 1", []);
        const hasCantidadTotal = chkRows && chkRows.length > 0;
        if (hasCantidadTotal) {
          await conn.query('UPDATE pedidos SET total = ?, cantidadTotal = ? WHERE idPedido = ?', [totalPedido, cantidadTotal, idPedido]);
        } else {
          await conn.query('UPDATE pedidos SET total = ? WHERE idPedido = ?', [totalPedido, idPedido]);
        }

        return { idPedido, total: totalPedido, cantidadTotal };
      });

      return res.json({ mensaje: 'Pedido creado', ...result });
    } catch (e) {
      console.error('[crearPedido] error', e);
      if (e && e.status) return res.status(e.status).json({ error: e.message });
      return res.status(500).json({ error: 'Error al crear pedido' });
    }
  })();
};

// Ver detalle de un pedido
const verDetallePedido = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT dp.idPedido, dp.idProducto, p.nombre AS nombreProducto, dp.cantidad, dp.precioUnitario FROM detalle_pedidos dp JOIN productos p ON dp.idProducto = p.idProducto WHERE dp.idPedido = ?`;
    const detalles = await db.query(query, [id]);
    return res.json(detalles);
  } catch (e) {
    console.error('[verDetallePedido] error', e);
    return res.status(500).json({ error: 'Error al obtener detalle del pedido' });
  }
};

// Eliminar pedido: restaurar stocks y eliminar dentro de transacción
const eliminarPedido = async (req, res) => {
  const { id } = req.params;
  try {
    await db.withTransaction(async (conn) => {
      const pedidos = await conn.query('SELECT * FROM pedidos WHERE idPedido=?', [id]);
      if (!pedidos || pedidos.length === 0) throw { status: 404, message: 'Pedido no encontrado' };
      const pedido = pedidos[0];
      const idSucursalOrigen = pedido.idSucursalOrigen;

      const detalles = await conn.query('SELECT idProducto, cantidad FROM detalle_pedidos WHERE idPedido=?', [id]);
      for (const d of detalles) {
        await conn.query('UPDATE stock_sucursal SET stockDisponible = stockDisponible + ? WHERE idProducto=? AND idSucursal=?', [d.cantidad, d.idProducto, idSucursalOrigen]);
        await conn.query('UPDATE productos SET stockTotal = stockTotal + ? WHERE idProducto=?', [d.cantidad, d.idProducto]);
      }

      await conn.query('DELETE FROM detalle_pedidos WHERE idPedido=?', [id]);
      await conn.query('DELETE FROM pedidos WHERE idPedido=?', [id]);
    });
    return res.json({ mensaje: 'Pedido eliminado y stock restaurado' });
  } catch (e) {
    console.error('[eliminarPedido] error', e);
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    return res.status(500).json({ error: 'Error al eliminar pedido' });
  }
};

// Listar stock por sucursal (incluye nombre del producto y sucursal)
const listarStockSucursal = async (req, res) => {
  try {
    const query = `
      SELECT ss.idSucursal, ss.idProducto, ss.stockDisponible, p.nombre as nombreProducto, s.nombre as nombreSucursal
      FROM stock_sucursal ss
      JOIN productos p ON ss.idProducto = p.idProducto
      JOIN sucursales s ON ss.idSucursal = s.idSucursal
      ORDER BY ss.idSucursal, p.idProducto
    `;
    const results = await db.query(query, []);
    return res.json(results);
  } catch (e) {
    console.error('[listarStockSucursal] error', e);
    return res.status(500).json({ error: 'Error al obtener stock por sucursal' });
  }
};

// Actualizar stock de un producto en una sucursal (solo stockDisponible)
const actualizarStockSucursal = async (req, res) => {
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
  try {
    await db.withTransaction(async (conn) => {
      const rows = await conn.query('SELECT stockDisponible FROM stock_sucursal WHERE idSucursal=? AND idProducto=?', [idSucursal, idProducto]);
      if (!rows || rows.length === 0) throw { status: 404, message: 'Registro de stock no encontrado para esa sucursal y producto' };
      const actual = Number(rows[0].stockDisponible || 0);
      const delta = nuevoStock - actual;

      await conn.query('UPDATE stock_sucursal SET stockDisponible = ? WHERE idSucursal=? AND idProducto=?', [nuevoStock, idSucursal, idProducto]);
      if (delta !== 0) {
        await conn.query('UPDATE productos SET stockTotal = stockTotal + ? WHERE idProducto=?', [delta, idProducto]);
      }

      registrarHistorial('stock_sucursal', idProducto, 'actualizar', null, `Stock sucursal ${idSucursal} cambiado de ${actual} a ${nuevoStock}`);
    });

    return res.json({ mensaje: 'Stock actualizado', idSucursal: Number(idSucursal), idProducto: Number(idProducto), stockDisponible: nuevoStock });
  } catch (e) {
    console.error('[actualizarStockSucursal] error', e);
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    return res.status(500).json({ error: 'Error al actualizar stock' });
  }
};

// Actualizar pedido (por ejemplo cambiar estado)
const actualizarPedido = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  if (!estado) return res.status(400).json({ error: 'Faltan datos (estado)' });
  try {
    const results = await db.query('SELECT * FROM pedidos WHERE idPedido=?', [id]);
    if (!results || results.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    await db.query('UPDATE pedidos SET estado=? WHERE idPedido=?', [estado, id]);
    registrarHistorial('pedidos', id, 'actualizar', results[0].idCliente || null, `Estado actualizado a: ${estado}`);
    if (String(estado).toLowerCase() === 'entregado') {
      const rowsCol = await db.query(`SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'fecha_entrega' LIMIT 1`, []);
      if (rowsCol && rowsCol.length > 0) {
        try {
          await db.query('UPDATE pedidos SET fecha_entrega = NOW() WHERE idPedido = ?', [id]);
        } catch (e) {
          console.error('Error al setear fecha_entrega:', e);
        }
      }
      return res.json({ mensaje: 'Pedido actualizado' });
    }
    return res.json({ mensaje: 'Pedido actualizado' });
  } catch (e) {
    console.error('[actualizarPedido] error', e);
    return res.status(500).json({ error: 'Error al actualizar pedido' });
  }
};

// --------- Analytics de ventas (basado en pedidos con estado 'Entregado')
const ventasSummary = async (req, res) => {
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
    JOIN detalle_pedidos dp ON dp.idPedido = pe.idPedido
    WHERE pe.estado = 'entregado' AND DATE(pe.fechaPedido) BETWEEN ? AND ?
  `;
  const params = [start, end];
  if (idSucursal) {
    sql += ' AND pe.idSucursalOrigen = ?';
    params.push(idSucursal);
  }

  try {
    const rows = await db.query(sql, params);
    const r = rows && rows[0] ? rows[0] : { pedidos_entregados:0, ingresos_totales:0, unidades_vendidas:0 };
    const aov = (r.pedidos_entregados && Number(r.pedidos_entregados) > 0) ? (Number(r.ingresos_totales) / Number(r.pedidos_entregados)) : 0;
    return res.json({ pedidos: Number(r.pedidos_entregados), ingresos: Number(r.ingresos_totales), unidades: Number(r.unidades_vendidas), aov: Number(aov) });
  } catch (e) {
    console.error('[ventasSummary] error', e);
    return res.status(500).json({ error: 'Error al calcular resumen de ventas' });
  }
};

const ventasTimeseries = async (req, res) => {
  const { fechaDesde, fechaHasta, idSucursal } = req.query;
  const end = fechaHasta || new Date().toISOString().slice(0, 10);
  const start = fechaDesde || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10); })();

  let sql = `
    SELECT DATE(pe.fechaPedido) AS fecha, 
      COUNT(DISTINCT pe.idPedido) AS pedidos,
      COALESCE(SUM(dp.cantidad * dp.precioUnitario),0) AS ingresos,
      COALESCE(SUM(dp.cantidad),0) AS unidades
    FROM pedidos pe
    JOIN detalle_pedidos dp ON dp.idPedido = pe.idPedido
    WHERE pe.estado = 'entregado' AND DATE(pe.fechaPedido) BETWEEN ? AND ?
    GROUP BY DATE(pe.fechaPedido)
    ORDER BY DATE(pe.fechaPedido) ASC
  `;
  const params = [start, end];
    if (idSucursal) {
    // inject filter by sucursal
    sql = sql.replace("WHERE pe.estado = 'entregado' AND DATE(pe.fechaPedido) BETWEEN ? AND ?", "WHERE pe.estado = 'entregado' AND DATE(pe.fechaPedido) BETWEEN ? AND ? AND pe.idSucursalOrigen = ?");
    params.push(idSucursal);
  }

  try {
    const rows = await db.query(sql, params);
    return res.json(rows.map(r => ({ fecha: r.fecha, pedidos: Number(r.pedidos), ingresos: Number(r.ingresos), unidades: Number(r.unidades) })));
  } catch (e) {
    console.error('[ventasTimeseries] error', e);
    return res.status(500).json({ error: 'Error al calcular series temporales de ventas' });
  }
};

const ventasTopProducts = async (req, res) => {
  const { fechaDesde, fechaHasta, limit, idSucursal } = req.query;
  const end = fechaHasta || new Date().toISOString().slice(0, 10);
  const start = fechaDesde || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10); })();
  const lim = limit ? Number(limit) : 10;

  let sql = `
    SELECT dp.idProducto, pr.nombre AS nombre, SUM(dp.cantidad) AS cantidad_vendida, SUM(dp.cantidad * dp.precioUnitario) AS ingresos
    FROM detalle_pedidos dp
    JOIN pedidos pe ON dp.idPedido = pe.idPedido
    JOIN productos pr ON dp.idProducto = pr.idProducto
    WHERE pe.estado = 'entregado' AND DATE(pe.fechaPedido) BETWEEN ? AND ?
    GROUP BY dp.idProducto
    ORDER BY ingresos DESC
    LIMIT ?
  `;
  const params = [start, end, lim];
    if (idSucursal) {
    // add filter to SQL (pe.idSucursalOrigen)
    sql = sql.replace("WHERE pe.estado = 'entregado' AND DATE(pe.fechaPedido) BETWEEN ? AND ?", "WHERE pe.estado = 'entregado' AND DATE(pe.fechaPedido) BETWEEN ? AND ? AND pe.idSucursalOrigen = ?");
    // params become [start, end, idSucursal, lim]
    params.splice(2, 0, idSucursal);
  }

  try {
    const rows = await db.query(sql, params);
    return res.json(rows.map(r => ({ idProducto: r.idProducto, nombre: r.nombre, cantidad: Number(r.cantidad_vendida), ingresos: Number(r.ingresos) })));
  } catch (e) {
    console.error('[ventasTopProducts] error', e);
    return res.status(500).json({ error: 'Error al obtener top de productos' });
  }
};


module.exports = {
  listarUsuarios,
  crearUsuario,
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
