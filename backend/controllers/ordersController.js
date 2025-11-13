const { connection } = require('../db/DB');

// Crear pedido desde el carrito del cliente
const createOrder = (req, res) => {
  const idUsuario = req.user.idUsuario;
  const { productos, observaciones, metodoPago, cuotas, interes, descuento, totalConInteres } = req.body;

  console.log('📦 Creando pedido para usuario:', idUsuario);
  console.log('📦 Productos recibidos:', productos);
  console.log('💳 Método de pago:', metodoPago, '| Cuotas:', cuotas, '| Interés:', interes, '%');

  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de productos' });
  }

  // Validar estructura de productos
  for (const producto of productos) {
    if (!producto.idProducto || !producto.cantidad || producto.cantidad <= 0) {
      return res.status(400).json({ 
        error: 'Cada producto debe tener idProducto y cantidad válidos' 
      });
    }
  }

  // Buscar el idCliente asociado al usuario
  connection.query(
    'SELECT idCliente FROM clientes WHERE idUsuario = ?',
    [idUsuario],
    (err, clienteRows) => {
      if (err) {
        console.error('❌ Error buscando cliente:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }

      if (!clienteRows || clienteRows.length === 0) {
        return res.status(404).json({ 
          error: 'No se encontró cliente asociado al usuario' 
        });
      }

      const idCliente = clienteRows[0].idCliente;

      // Iniciar transacción
      connection.beginTransaction((trxErr) => {
        if (trxErr) {
          console.error('❌ Error iniciando transacción:', trxErr);
          return res.status(500).json({ error: 'Error del servidor' });
        }

        // Crear el pedido principal
        const fechaPedido = new Date();
        const insertPedidoQuery = `
          INSERT INTO pedidos (idCliente, estado, fechaPedido, observaciones, idSucursalOrigen, metodoPago, cuotas, interes, descuento, totalConInteres) 
          VALUES (?, 'Pendiente', ?, ?, 1, ?, ?, ?, ?, ?)
        `;

        connection.query(
          insertPedidoQuery,
          [idCliente, fechaPedido, observaciones || null, metodoPago || 'Efectivo', cuotas || 1, interes || 0, descuento || 0, totalConInteres || 0],
          (err, pedidoResult) => {
            if (err) {
              console.error('❌ Error creando pedido:', err);
              return connection.rollback(() => {
                res.status(500).json({ error: 'Error creando pedido' });
              });
            }

            const idPedido = pedidoResult.insertId;
            console.log('✅ Pedido creado con ID:', idPedido);

            // Insertar productos del pedido
            let productosInsertados = 0;
            let totalPedido = 0;

            const insertarProducto = (index) => {
              if (index >= productos.length) {
                // Todos los productos insertados, actualizar total del pedido
                const totalFinal = totalConInteres || totalPedido;
                connection.query(
                  'UPDATE pedidos SET total = ? WHERE idPedido = ?',
                  [totalFinal, idPedido],
                  (updateErr) => {
                    if (updateErr) {
                      console.error('❌ Error actualizando total:', updateErr);
                      return connection.rollback(() => {
                        res.status(500).json({ error: 'Error actualizando total' });
                      });
                    }

                    // Confirmar transacción
                    connection.commit((commitErr) => {
                      if (commitErr) {
                        console.error('❌ Error confirmando transacción:', commitErr);
                        return connection.rollback(() => {
                          res.status(500).json({ error: 'Error confirmando pedido' });
                        });
                      }

                      console.log('✅ Pedido creado exitosamente:', idPedido);
                      res.status(201).json({
                        message: 'Pedido creado exitosamente',
                        idPedido: idPedido,
                        total: totalPedido
                      });
                    });
                  }
                );
                return;
              }

              const producto = productos[index];

              // Obtener información del producto
              connection.query(
                'SELECT nombre, precio FROM productos WHERE idProducto = ?',
                [producto.idProducto],
                (prodErr, prodRows) => {
                  if (prodErr) {
                    console.error('❌ Error obteniendo producto:', prodErr);
                    return connection.rollback(() => {
                      res.status(500).json({ error: 'Error obteniendo información del producto' });
                    });
                  }

                  if (!prodRows || prodRows.length === 0) {
                    return connection.rollback(() => {
                      res.status(404).json({ 
                        error: `Producto con ID ${producto.idProducto} no encontrado` 
                      });
                    });
                  }

                  const productoInfo = prodRows[0];
                  const subtotal = productoInfo.precio * producto.cantidad;
                  totalPedido += subtotal;

                  // Insertar en detalle_pedidos
                  const insertDetalleQuery = `
                    INSERT INTO detalle_pedidos (idPedido, idProducto, cantidad, precioUnitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                  `;

                  connection.query(
                    insertDetalleQuery,
                    [idPedido, producto.idProducto, producto.cantidad, productoInfo.precio, subtotal],
                    (detalleErr) => {
                      if (detalleErr) {
                        console.error('❌ Error insertando detalle:', detalleErr);
                        return connection.rollback(() => {
                          res.status(500).json({ error: 'Error insertando detalle del pedido' });
                        });
                      }

                      productosInsertados++;
                      console.log(`✅ Producto ${index + 1}/${productos.length} insertado`);
                      
                      // Continuar con el siguiente producto
                      insertarProducto(index + 1);
                    }
                  );
                }
              );
            };

            // Comenzar inserción de productos
            insertarProducto(0);
          }
        );
      });
    }
  );
};

// Obtener pedidos del cliente
const getMyOrders = (req, res) => {
  const idUsuario = req.user.idUsuario;

  const query = `
    SELECT 
      p.idPedido,
      p.fechaPedido,
      p.estado,
      p.total,
      p.observaciones,
      COUNT(dp.idProducto) as cantidadProductos
    FROM pedidos p
    INNER JOIN clientes c ON p.idCliente = c.idCliente
    LEFT JOIN detalle_pedidos dp ON p.idPedido = dp.idPedido
    WHERE c.idUsuario = ?
    GROUP BY p.idPedido
    ORDER BY p.fechaPedido DESC
  `;

  connection.query(query, [idUsuario], (err, results) => {
    if (err) {
      console.error('❌ Error obteniendo pedidos:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }

    console.log(`📦 Pedidos encontrados para usuario ${idUsuario}:`, results.length);
    res.json(results);
  });
};

// Obtener detalles de un pedido específico
const getMyOrderDetails = (req, res) => {
  const idUsuario = req.user.idUsuario;
  const idPedido = req.params.id;

  const query = `
    SELECT 
      p.idPedido,
      p.fechaPedido,
      p.estado,
      p.total,
      p.observaciones,
      dp.cantidad,
      dp.precioUnitario,
      dp.subtotal,
      prod.nombre as nombreProducto,
      prod.descripcion
    FROM pedidos p
    INNER JOIN clientes c ON p.idCliente = c.idCliente
    LEFT JOIN detalle_pedidos dp ON p.idPedido = dp.idPedido
    LEFT JOIN productos prod ON dp.idProducto = prod.idProducto
    WHERE c.idUsuario = ? AND p.idPedido = ?
    ORDER BY dp.idDetallePedido
  `;

  connection.query(query, [idUsuario, idPedido], (err, results) => {
    if (err) {
      console.error('❌ Error obteniendo detalle del pedido:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Estructurar la respuesta
    const pedido = {
      idPedido: results[0].idPedido,
      fechaPedido: results[0].fechaPedido,
      estado: results[0].estado,
      total: results[0].total,
      observaciones: results[0].observaciones,
      productos: results.map(row => ({
        nombreProducto: row.nombreProducto,
        descripcion: row.descripcion,
        cantidad: row.cantidad,
        precioUnitario: row.precioUnitario,
        subtotal: row.subtotal
      }))
    };

    res.json(pedido);
  });
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderDetails
};