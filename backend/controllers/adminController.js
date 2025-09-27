const { connection } = require('../db/DB');

// USUARIOS
const listarUsuarios = (req, res) => {
    const query = `SELECT u.*, r.nombreRol FROM usuarios u JOIN roles r ON u.idRol = r.idRol`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener usuarios" });
        res.json(results);
    });
};

const crearUsuario = (req, res) => {
    const { nombre, apellido, email, password, idRol } = req.body;
    if (!nombre || !apellido || !email || !password || !idRol) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    // Validar email único
    connection.query('SELECT * FROM usuarios WHERE email=?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: "Error al validar email" });
        if (results.length > 0) return res.status(409).json({ error: "El email ya está registrado" });
        const query = 'INSERT INTO usuarios (nombre, apellido, email, password, idRol) VALUES (?, ?, ?, ?, ?)';
        connection.query(query, [nombre, apellido, email, password, idRol], (err2, result) => {
            if (err2) return res.status(500).json({ error: "Error al crear usuario" });
            // Registrar en historial de cambios
            registrarHistorial('usuarios', result.insertId, 'crear', email, `Usuario creado: ${nombre} ${apellido}`);
            res.json({ mensaje: "Usuario creado", id: result.insertId });
        });
    });
};

const actualizarUsuario = (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, password, idRol } = req.body;
    // Validar existencia
    connection.query('SELECT * FROM usuarios WHERE idUsuario=?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Error al buscar usuario" });
        if (results.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
        const query = 'UPDATE usuarios SET nombre=?, apellido=?, email=?, password=?, idRol=? WHERE idUsuario=?';
        connection.query(query, [nombre, apellido, email, password, idRol, id], (err2, result) => {
            if (err2) return res.status(500).json({ error: "Error al actualizar usuario" });
            registrarHistorial('usuarios', id, 'actualizar', email, `Usuario actualizado: ${nombre} ${apellido}`);
            res.json({ mensaje: "Usuario actualizado" });
        });
    });
};

const eliminarUsuario = (req, res) => {
    const { id } = req.params;
    connection.query('SELECT * FROM usuarios WHERE idUsuario=?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Error al buscar usuario" });
        if (results.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
        const email = results[0].email;
        connection.query('DELETE FROM usuarios WHERE idUsuario=?', [id], (err2, result) => {
            if (err2) return res.status(500).json({ error: "Error al eliminar usuario" });
            registrarHistorial('usuarios', id, 'eliminar', email, `Usuario eliminado`);
            res.json({ mensaje: "Usuario eliminado" });
        });
    });
};
// SUCURSALES
const listarSucursales = (req, res) => {
    connection.query('SELECT * FROM sucursales', (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener sucursales" });
        res.json(results);
    });
};

// CLIENTES
const listarClientes = (req, res) => {
    const query = `SELECT c.*, u.nombre, u.apellido, u.email FROM clientes c JOIN usuarios u ON c.idUsuario = u.idUsuario`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener clientes" });
        res.json(results);
    });
};

// SERVICIOS POSTVENTA
const listarServicios = (req, res) => {
    connection.query('SELECT * FROM servicios_postventa', (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener servicios" });
        res.json(results);
    });
};

// HISTORIAL DE CAMBIOS
const registrarHistorial = (tabla, idRegistro, accion, usuario, descripcion) => {
    const query = 'INSERT INTO historial_cambios (tabla, idRegistro, accion, usuario, descripcion) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [tabla, idRegistro, accion, usuario, descripcion], (err) => {
        if (err) console.error('Error al registrar historial:', err);
    });
};

// PRODUCTOS
const listarProductos = (req, res) => {
    const query = `SELECT idProducto, nombre, descripcion, precio, stockTotal AS stock FROM productos`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener productos" });
        res.json(results);
    });
};

const crearProducto = (req, res) => {
    const { nombre, descripcion, precio, stockTotal } = req.body;
    if (!nombre || !precio) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    // sucursales opcion: array de ids de sucursales a las que asignar el producto
    const sucursalesSelected = req.body.sucursales || []; // ejemplo: [1,2]
    const query = 'INSERT INTO productos (nombre, descripcion, precio, stockTotal) VALUES (?, ?, ?, ?)';
    connection.query(query, [nombre, descripcion, precio, stockTotal], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al crear producto" });
        const idProducto = result.insertId;

        // Obtener lista de sucursales del sistema
        connection.query('SELECT idSucursal FROM sucursales', (err2, sucursalesAll) => {
            if (err2) return res.status(500).json({ error: 'Error al obtener sucursales' });

            let targets = [];
            if (Array.isArray(sucursalesSelected) && sucursalesSelected.length > 0) {
                // Usar solo las sucursales seleccionadas (filtrar por las que existen)
                const existIds = sucursalesAll.map(s => s.idSucursal);
                targets = sucursalesSelected.filter(id => existIds.includes(Number(id))).map(id => Number(id));
            } else {
                // Si no se proporcionaron, crear entradas con 0 en todas las sucursales
                targets = sucursalesAll.map(s => s.idSucursal);
            }

            if (targets.length === 0) return res.json({ mensaje: 'Producto creado, sin sucursales disponibles', id: idProducto });

            // Distribuir stockTotal entre las sucursales seleccionadas (si hay stockTotal > 0)
            const total = Number(stockTotal) || 0;
            const n = targets.length;
            const base = Math.floor(total / n);
            let remainder = total % n;

            // Insertar filas en stock_sucursal para cada target
            const insertar = (i) => {
                if (i >= targets.length) {
                    return res.json({ mensaje: 'Producto creado y stock por sucursal inicializado', id: idProducto });
                }
                const idSucursal = targets[i];
                const asignado = total > 0 ? base + (remainder > 0 ? (remainder--, 1) : 0) : 0;
                connection.query('INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, ?)', [idSucursal, idProducto, asignado], (err3) => {
                    if (err3) return res.status(500).json({ error: 'Error al crear stock_sucursal inicial' });
                    insertar(i + 1);
                });
            };

            insertar(0);
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
            productos.forEach(p => {
                sucursales.forEach(s => {
                    tareas.push([s.idSucursal, p.idProducto]);
                });
            });

            if (tareas.length === 0) return res.json({ mensaje: 'No hay combinaciones para procesar' });

            // Procesar en serie para evitar duplicados por constraints
            const procesar = (i) => {
                if (i >= tareas.length) return res.json({ mensaje: 'Backfill completado' });
                const [idSucursal, idProducto] = tareas[i];
                connection.query('SELECT 1 FROM stock_sucursal WHERE idSucursal=? AND idProducto=?', [idSucursal, idProducto], (err3, rows) => {
                    if (err3) return res.status(500).json({ error: 'Error al comprobar stock_sucursal' });
                    if (rows && rows.length > 0) return procesar(i + 1);
                    connection.query('INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, 0)', [idSucursal, idProducto], (err4) => {
                        if (err4) return res.status(500).json({ error: 'Error al insertar stock_sucursal durante backfill' });
                        procesar(i + 1);
                    });
                });
            };

            procesar(0);
        });
    });
};

// Reconciliar stockTotal de un producto con las filas de stock_sucursal
const reconcileStockProducto = (req, res) => {
    const { idProducto } = req.params;
    // Obtener stockTotal actual
    connection.query('SELECT stockTotal FROM productos WHERE idProducto=?', [idProducto], (err, prodRows) => {
        if (err) return res.status(500).json({ error: 'Error al obtener producto' });
        if (!prodRows || prodRows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        const total = Number(prodRows[0].stockTotal || 0);

        // Obtener filas existentes en stock_sucursal para este producto
        connection.query('SELECT idSucursal, stockDisponible FROM stock_sucursal WHERE idProducto=?', [idProducto], (err2, rows) => {
            if (err2) return res.status(500).json({ error: 'Error al obtener stock_sucursal' });

            const procesarDistribucion = (targets) => {
                // targets: array of { idSucursal, current }
                // Si no hay targets, crear para todas las sucursales
                if (!targets || targets.length === 0) {
                    // crear filas y distribuir
                    connection.query('SELECT idSucursal FROM sucursales', (err3, sucursalesAll) => {
                        if (err3) return res.status(500).json({ error: 'Error al obtener sucursales' });
                        if (!sucursalesAll || sucursalesAll.length === 0) return res.status(400).json({ error: 'No hay sucursales configuradas' });
                        const ids = sucursalesAll.map(s => s.idSucursal);
                        // distribuir evenly
                        const n = ids.length;
                        const base = Math.floor(total / n);
                        let rem = total % n;

                        connection.beginTransaction((trxErr) => {
                            if (trxErr) return res.status(500).json({ error: 'Error al iniciar transacción' });
                            const insertOne = (i) => {
                                if (i >= ids.length) return connection.commit(errc => { if (errc) return connection.rollback(() => res.status(500).json({ error: 'Error al confirmar transacción' })); res.json({ mensaje: 'Stock reconciliado y filas creadas' }); });
                                const idSuc = ids[i];
                                const asign = base + (rem > 0 ? (rem--, 1) : 0);
                                connection.query('INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible) VALUES (?, ?, ?)', [idSuc, idProducto, asign], (err4) => {
                                    if (err4) return connection.rollback(() => res.status(500).json({ error: 'Error al insertar stock_sucursal' }));
                                    insertOne(i + 1);
                                });
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
                        targets.forEach(t => {
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
                        if (i >= updates.length) return connection.commit(errc => { if (errc) return connection.rollback(() => res.status(500).json({ error: 'Error al confirmar transacción' })); res.json({ mensaje: 'Stock reconciliado' }); });
                        const u = updates[i];
                        connection.query('UPDATE stock_sucursal SET stockDisponible=? WHERE idProducto=? AND idSucursal=?', [u.asign, idProducto, u.idSucursal], (err5) => {
                            if (err5) return connection.rollback(() => res.status(500).json({ error: 'Error al actualizar stock_sucursal' }));
                            applyOne(i + 1);
                        });
                    };

                    applyOne(0);
                });
            };

            if (!rows || rows.length === 0) return procesarDistribucion([]);
            // map rows to targets
            const targets = rows.map(r => ({ idSucursal: r.idSucursal, stockDisponible: r.stockDisponible }));
            procesarDistribucion(targets);
        });
    });
};

const actualizarProducto = (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stockTotal } = req.body;
    const query = 'UPDATE productos SET nombre=?, descripcion=?, precio=?, stockTotal=? WHERE idProducto=?';
    connection.query(query, [nombre, descripcion, precio, stockTotal, id], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al actualizar producto" });
        res.json({ mensaje: "Producto actualizado" });
    });
};

const eliminarProducto = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM productos WHERE idProducto=?';
    connection.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al eliminar producto" });
        res.json({ mensaje: "Producto eliminado" });
    });
};

// PEDIDOS (VENTAS)
const listarPedidos = (req, res) => {
    const query = `
        SELECT pe.idPedido, u.nombre AS nombreUsuario, u.apellido AS apellidoUsuario, pe.fecha, pe.estado
        FROM pedidos pe
        JOIN usuarios u ON pe.idCliente = u.idUsuario
        ORDER BY pe.fecha DESC
    `;
    connection.query(query, (err, pedidos) => {
        if (err) return res.status(500).json({ error: "Error al obtener pedidos" });
        if (!pedidos.length) return res.json([]);
        // Obtener productos de cada pedido
        const ids = pedidos.map(p => p.idPedido);
        const queryDetalles = `
            SELECT dp.idPedido, pr.nombre AS nombreProducto, dp.cantidad, dp.precioUnitario
            FROM detalle_pedido dp
            JOIN productos pr ON dp.idProducto = pr.idProducto
            WHERE dp.idPedido IN (${ids.join(',')})
        `;
        connection.query(queryDetalles, (err2, detalles) => {
            if (err2) return res.status(500).json({ error: "Error al obtener detalles" });
            // Agrupar productos por pedido
            const pedidosFinal = pedidos.map(p => {
                const productos = detalles.filter(d => d.idPedido === p.idPedido)
                  .map(d => ({ nombre: d.nombreProducto, cantidad: d.cantidad, total: d.cantidad * d.precioUnitario }));
                const total = productos.reduce((acc, prod) => acc + prod.total, 0);
                return { ...p, productos, total };
            });
            res.json(pedidosFinal);
        });
    });
};

const crearPedido = (req, res) => {
    const { idCliente, estado, idSucursalOrigen, productos } = req.body;
    if (!idCliente || !estado || !idSucursalOrigen || !productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ error: "Faltan datos obligatorios o productos no es un array" });
    }

    // Validar que el idCliente corresponda a un usuario con rol 'Cliente'
    const queryRol = `SELECT r.nombreRol FROM usuarios u JOIN roles r ON u.idRol = r.idRol WHERE u.idUsuario = ?`;
    connection.query(queryRol, [idCliente], (err, rolRes) => {
        if (err) return res.status(500).json({ error: 'Error al validar rol del cliente' });
        if (!rolRes || rolRes.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        const nombreRol = (rolRes[0].nombreRol || '').toLowerCase();
        if (nombreRol !== 'cliente') return res.status(403).json({ error: 'Solo usuarios con rol Cliente pueden registrar pedidos' });

        // Iniciar transacción
        connection.beginTransaction((trxErr) => {
            if (trxErr) return res.status(500).json({ error: 'Error al iniciar transacción' });

            const queryPedido = 'INSERT INTO pedidos (idCliente, estado, idSucursalOrigen) VALUES (?, ?, ?)';
            connection.query(queryPedido, [idCliente, estado, idSucursalOrigen], (err2, result) => {
                if (err2) return connection.rollback(() => res.status(500).json({ error: "Error al crear pedido" }));
                const idPedido = result.insertId;

                // Procesar productos en serie para insertar detalle y decrementar stocks
                const procesarProducto = (i) => {
                    if (i >= productos.length) {
                        // Todo ok, confirmar transacción
                        connection.commit((commitErr) => {
                            if (commitErr) return connection.rollback(() => res.status(500).json({ error: 'Error al confirmar transacción' }));
                            res.json({ mensaje: 'Pedido creado', idPedido });
                        });
                        return;
                    }
                    const p = productos[i];
                    // Insertar detalle
                    const insertDetalle = 'INSERT INTO detalle_pedido (idPedido, idProducto, cantidad, precioUnitario) VALUES (?, ?, ?, ?)';
                    connection.query(insertDetalle, [idPedido, p.idProducto, p.cantidad, p.precioUnitario || 0], (err3) => {
                        if (err3) return connection.rollback(() => res.status(500).json({ error: 'Error al insertar detalle de pedido' }));
                        // Decrementar stock en sucursal (asegurando no quedar negativo)
                        const updSucursal = 'UPDATE stock_sucursal SET stockDisponible = stockDisponible - ? WHERE idProducto=? AND idSucursal=? AND stockDisponible >= ?';
                        connection.query(updSucursal, [p.cantidad, p.idProducto, idSucursalOrigen, p.cantidad], (err4, updRes) => {
                            if (err4) return connection.rollback(() => res.status(500).json({ error: 'Error al actualizar stock en sucursal' }));
                            if (!updRes || updRes.affectedRows === 0) return connection.rollback(() => res.status(400).json({ error: `Stock insuficiente para producto ${p.idProducto} en sucursal ${idSucursalOrigen}` }));
                            // Decrementar stock total en productos
                            connection.query('UPDATE productos SET stockTotal = stockTotal - ? WHERE idProducto=?', [p.cantidad, p.idProducto], (err5) => {
                                if (err5) return connection.rollback(() => res.status(500).json({ error: 'Error al actualizar stock total del producto' }));
                                procesarProducto(i + 1);
                            });
                        });
                    });
                };

                procesarProducto(0);
            });
        });
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
            if (err) return connection.rollback(() => res.status(500).json({ error: 'Error al buscar pedido' }));
            if (!pedidos || pedidos.length === 0) return connection.rollback(() => res.status(404).json({ error: 'Pedido no encontrado' }));

            const pedido = pedidos[0];
            const idSucursalOrigen = pedido.idSucursalOrigen;

            connection.query('SELECT idProducto, cantidad FROM detalle_pedido WHERE idPedido=?', [id], (err2, detalles) => {
                if (err2) return connection.rollback(() => res.status(500).json({ error: 'Error al obtener detalles del pedido' }));

                const procesarDetalle = (i) => {
                    if (i >= detalles.length) {
                        // eliminar detalles y pedido
                        connection.query('DELETE FROM detalle_pedido WHERE idPedido=?', [id], (err5) => {
                            if (err5) return connection.rollback(() => res.status(500).json({ error: 'Error al eliminar detalle de pedido' }));
                            connection.query('DELETE FROM pedidos WHERE idPedido=?', [id], (err6) => {
                                if (err6) return connection.rollback(() => res.status(500).json({ error: 'Error al eliminar pedido' }));
                                connection.commit((commitErr) => {
                                    if (commitErr) return connection.rollback(() => res.status(500).json({ error: 'Error al confirmar transacción' }));
                                    res.json({ mensaje: 'Pedido eliminado y stock restaurado' });
                                });
                            });
                        });
                        return;
                    }
                    const d = detalles[i];
                    connection.query('UPDATE stock_sucursal SET stockDisponible = stockDisponible + ? WHERE idProducto=? AND idSucursal=?', [d.cantidad, d.idProducto, idSucursalOrigen], (err3) => {
                        if (err3) return connection.rollback(() => res.status(500).json({ error: 'Error al restaurar stock_sucursal' }));
                        connection.query('UPDATE productos SET stockTotal = stockTotal + ? WHERE idProducto=?', [d.cantidad, d.idProducto], (err4) => {
                            if (err4) return connection.rollback(() => res.status(500).json({ error: 'Error al restaurar stock total' }));
                            procesarDetalle(i + 1);
                        });
                    });
                };

                procesarDetalle(0);
            });
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
    if (stockDisponible === undefined || isNaN(Number(stockDisponible)) || Number(stockDisponible) < 0) {
        return res.status(400).json({ error: 'stockDisponible inválido' });
    }
    const nuevoStock = Number(stockDisponible);

    connection.beginTransaction((trxErr) => {
        if (trxErr) return res.status(500).json({ error: 'Error al iniciar transacción' });

        // Obtener stock actual
        connection.query('SELECT stockDisponible FROM stock_sucursal WHERE idSucursal=? AND idProducto=?', [idSucursal, idProducto], (err, rows) => {
            if (err) return connection.rollback(() => res.status(500).json({ error: 'Error al buscar stock_sucursal' }));
            if (!rows || rows.length === 0) return connection.rollback(() => res.status(404).json({ error: 'Registro de stock no encontrado para esa sucursal y producto' }));
            const actual = Number(rows[0].stockDisponible || 0);
            const delta = nuevoStock - actual;

            // Actualizar stock_sucursal al nuevo valor
            connection.query('UPDATE stock_sucursal SET stockDisponible = ? WHERE idSucursal=? AND idProducto=?', [nuevoStock, idSucursal, idProducto], (err2) => {
                if (err2) return connection.rollback(() => res.status(500).json({ error: 'Error al actualizar stock_sucursal' }));

                // Ajustar stockTotal en productos por la diferencia
                if (delta !== 0) {
                    connection.query('UPDATE productos SET stockTotal = stockTotal + ? WHERE idProducto=?', [delta, idProducto], (err3) => {
                        if (err3) return connection.rollback(() => res.status(500).json({ error: 'Error al actualizar stock total del producto' }));
                        // Registrar historial (usar idProducto como referencia)
                        registrarHistorial('stock_sucursal', idProducto, 'actualizar', null, `Stock sucursal ${idSucursal} cambiado de ${actual} a ${nuevoStock}`);
                        connection.commit((commitErr) => {
                            if (commitErr) return connection.rollback(() => res.status(500).json({ error: 'Error al confirmar transacción' }));
                            res.json({ mensaje: 'Stock actualizado', idSucursal: Number(idSucursal), idProducto: Number(idProducto), stockDisponible: nuevoStock });
                        });
                    });
                } else {
                    // No hay cambio en delta, solo commit
                    registrarHistorial('stock_sucursal', idProducto, 'actualizar', null, `Stock sucursal ${idSucursal} confirmado sin cambios (${actual})`);
                    connection.commit((commitErr) => {
                        if (commitErr) return connection.rollback(() => res.status(500).json({ error: 'Error al confirmar transacción' }));
                        res.json({ mensaje: 'Stock actualizado', idSucursal: Number(idSucursal), idProducto: Number(idProducto), stockDisponible: nuevoStock });
                    });
                }
            });
        });
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
            registrarHistorial('pedidos', id, 'actualizar', results[0].idCliente || null, `Estado actualizado a: ${estado}`);
            res.json({ mensaje: 'Pedido actualizado' });
        });
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
    listarServicios
};

