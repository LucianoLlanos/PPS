-- =====================================================
-- BASE DE DATOS COMPLETA - PROYECTO PPS
-- Sistema de E-commerce con Gestión de Servicios
-- =====================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS atilio_marola;
USE atilio_marola;

-- =====================================================
-- 1. TABLA DE ROLES
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    idRol INT AUTO_INCREMENT PRIMARY KEY,
    nombreRol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

-- Insertar roles básicos
INSERT INTO roles (idRol, nombreRol, descripcion) VALUES
(1, 'Cliente', 'Usuario que puede comprar productos y solicitar servicios'),
(2, 'Vendedor', 'Usuario que puede gestionar ventas y productos'),
(3, 'Administrador', 'Usuario con acceso completo al sistema');

-- =====================================================
-- 2. TABLA DE USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    idRol INT NOT NULL,
    fechaRegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (idRol) REFERENCES roles(idRol)
);

-- Insertar usuarios de ejemplo
INSERT INTO usuarios (nombre, apellido, email, password, idRol) VALUES
('Admin', 'Sistema', 'admin@atiliomarola.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IYZIP/CqVvOUMLEL6jE0ZQZZ6zLzze', 3),
('Juan', 'Pérez', 'juan.perez@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IYZIP/CqVvOUMLEL6jE0ZQZZ6zLzze', 1),
('María', 'González', 'maria.gonzalez@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IYZIP/CqVvOUMLEL6jE0ZQZZ6zLzze', 1),
('Carlos', 'Vendedor', 'carlos.vendedor@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IYZIP/CqVvOUMLEL6jE0ZQZZ6zLzze', 2);

-- =====================================================
-- 3. TABLA DE CLIENTES (Información adicional)
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    idCliente INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL UNIQUE,
    direccion VARCHAR(500),
    telefono VARCHAR(20),
    fechaNacimiento DATE,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE
);

-- Insertar clientes de ejemplo
INSERT INTO clientes (idUsuario, direccion, telefono) VALUES
(2, 'Av. Corrientes 1234, CABA', '+54 11 1234-5678'),
(3, 'Av. Santa Fe 5678, CABA', '+54 11 8765-4321');

-- =====================================================
-- 4. TABLA DE SUCURSALES
-- =====================================================
CREATE TABLE IF NOT EXISTS sucursales (
    idSucursal INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(500) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    horario VARCHAR(200),
    activa BOOLEAN DEFAULT TRUE
);

-- Insertar sucursales de ejemplo
INSERT INTO sucursales (idSucursal, nombre, direccion, telefono, email, horario) VALUES
(1, 'Sucursal Centro', 'Av. Rivadavia 1000, CABA', '+54 11 4000-1000', 'centro@atiliomarola.com', 'Lun-Vie: 9:00-18:00, Sáb: 9:00-13:00'),
(2, 'Sucursal Norte', 'Av. Cabildo 2000, CABA', '+54 11 4000-2000', 'norte@atiliomarola.com', 'Lun-Vie: 8:30-19:00, Sáb: 9:00-14:00'),
(3, 'Sucursal Sur', 'Av. Avellaneda 3000, Avellaneda', '+54 11 4000-3000', 'sur@atiliomarola.com', 'Lun-Vie: 9:00-17:30');

-- =====================================================
-- 5. TABLA DE PRODUCTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
    idProducto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stockTotal INT DEFAULT 0,
    imagen VARCHAR(255), -- Imagen principal (mantener por compatibilidad)
    categoria VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. TABLA DE IMÁGENES DE PRODUCTOS (Sistema múltiple)
-- =====================================================
CREATE TABLE IF NOT EXISTS producto_imagenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    imagen VARCHAR(255) NOT NULL,
    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(idProducto) ON DELETE CASCADE,
    INDEX idx_producto_orden (producto_id, orden)
);

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, stockTotal, categoria) VALUES
('Bomba de Agua 1HP', 'Bomba centrífuga para uso doméstico e industrial. Ideal para extracción de agua de pozos y cisternas.', 45000.00, 15, 'Bombas'),
('Panel Solar 300W', 'Panel solar fotovoltaico de alta eficiencia. Ideal para sistemas de energía renovable.', 85000.00, 8, 'Energía Solar'),
('Tanque de Agua 1000L', 'Tanque de polietileno de alta resistencia para almacenamiento de agua potable.', 60000.00, 12, 'Tanques'),
('Motor Eléctrico 2HP', 'Motor eléctrico trifásico de alta eficiencia para uso industrial.', 120000.00, 6, 'Motores'),
('Inversor Solar 5KW', 'Inversor de corriente para sistemas solares fotovoltaicos residenciales.', 200000.00, 4, 'Energía Solar');

-- =====================================================
-- 7. TABLA DE STOCK POR SUCURSAL
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_sucursal (
    idStock INT AUTO_INCREMENT PRIMARY KEY,
    idSucursal INT NOT NULL,
    idProducto INT NOT NULL,
    stockDisponible INT DEFAULT 0,
    stockMinimo INT DEFAULT 5,
    fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idSucursal) REFERENCES sucursales(idSucursal),
    FOREIGN KEY (idProducto) REFERENCES productos(idProducto),
    UNIQUE KEY unique_sucursal_producto (idSucursal, idProducto)
);

-- Insertar stock por sucursal de ejemplo
INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible, stockMinimo) VALUES
-- Bomba de Agua 1HP
(1, 1, 5, 2),
(2, 1, 6, 2),
(3, 1, 4, 2),
-- Panel Solar 300W
(1, 2, 3, 1),
(2, 2, 3, 1),
(3, 2, 2, 1),
-- Tanque de Agua 1000L
(1, 3, 4, 2),
(2, 3, 4, 2),
(3, 3, 4, 2),
-- Motor Eléctrico 2HP
(1, 4, 2, 1),
(2, 4, 2, 1),
(3, 4, 2, 1),
-- Inversor Solar 5KW
(1, 5, 1, 1),
(2, 5, 2, 1),
(3, 5, 1, 1);

-- =====================================================
-- 8. TABLA DE PEDIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS pedidos (
    idPedido INT AUTO_INCREMENT PRIMARY KEY,
    idCliente INT NOT NULL,
    idSucursal INT,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    metodoPago VARCHAR(50),
    direccionEnvio VARCHAR(500),
    observaciones TEXT,
    fechaPedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idCliente) REFERENCES usuarios(idUsuario),
    FOREIGN KEY (idSucursal) REFERENCES sucursales(idSucursal)
);

-- =====================================================
-- 9. TABLA DE DETALLES DE PEDIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_pedidos (
    idDetalle INT AUTO_INCREMENT PRIMARY KEY,
    idPedido INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    precioUnitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (idPedido) REFERENCES pedidos(idPedido) ON DELETE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES productos(idProducto)
);

-- Insertar pedidos de ejemplo
INSERT INTO pedidos (idCliente, idSucursal, total, estado, metodoPago, direccionEnvio) VALUES
(2, 1, 45000.00, 'entregado', 'transferencia', 'Av. Corrientes 1234, CABA'),
(3, 2, 145000.00, 'confirmado', 'efectivo', 'Av. Santa Fe 5678, CABA');

-- Insertar detalles de pedidos
INSERT INTO detalle_pedidos (idPedido, idProducto, cantidad, precioUnitario, subtotal) VALUES
(1, 1, 1, 45000.00, 45000.00),
(2, 2, 1, 85000.00, 85000.00),
(2, 3, 1, 60000.00, 60000.00);

-- =====================================================
-- 10. TABLA DE SOLICITUDES DE SERVICIOS POST-VENTA
-- =====================================================
CREATE TABLE IF NOT EXISTS solicitudes_servicio_postventa (
    idSolicitud INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    tipoServicio ENUM('instalacion', 'mantenimiento', 'garantia') NOT NULL,
    descripcion TEXT NOT NULL,
    direccion VARCHAR(500) NOT NULL,
    telefono VARCHAR(20),
    fechaPreferida DATE,
    horaPreferida TIME,
    estado ENUM('pendiente', 'confirmado', 'en_proceso', 'completado', 'cancelado') DEFAULT 'pendiente',
    observacionesAdmin TEXT,
    fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario)
);

-- Insertar solicitudes de servicios de ejemplo
INSERT INTO solicitudes_servicio_postventa (idUsuario, tipoServicio, descripcion, direccion, telefono, fechaPreferida, horaPreferida, estado) VALUES
(2, 'instalacion', 'Instalación de bomba de agua 1HP en casa quinta', 'Av. Corrientes 1234, CABA', '+54 11 1234-5678', '2025-10-25', '14:00:00', 'pendiente'),
(3, 'mantenimiento', 'Mantenimiento preventivo de panel solar', 'Av. Santa Fe 5678, CABA', '+54 11 8765-4321', '2025-10-26', '09:00:00', 'confirmado'),
(2, 'garantia', 'Revisión de motor eléctrico por ruidos extraños', 'Av. Corrientes 1234, CABA', '+54 11 1234-5678', '2025-10-24', '16:00:00', 'en_proceso');

-- =====================================================
-- 11. TABLA DE HISTORIAL (Para auditoría)
-- =====================================================
CREATE TABLE IF NOT EXISTS historial (
    idHistorial INT AUTO_INCREMENT PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL,
    idRegistro INT NOT NULL,
    accion ENUM('crear', 'actualizar', 'eliminar') NOT NULL,
    usuario VARCHAR(255),
    descripcion TEXT,
    fechaAccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 12. ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(idRol);

-- Índices para productos
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_precio ON productos(precio);

-- Índices para pedidos
CREATE INDEX idx_pedidos_cliente ON pedidos(idCliente);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON pedidos(fechaPedido);

-- Índices para servicios
CREATE INDEX idx_servicios_usuario ON solicitudes_servicio_postventa(idUsuario);
CREATE INDEX idx_servicios_estado ON solicitudes_servicio_postventa(estado);
CREATE INDEX idx_servicios_tipo ON solicitudes_servicio_postventa(tipoServicio);
CREATE INDEX idx_servicios_fecha_creacion ON solicitudes_servicio_postventa(fechaCreacion);

-- =====================================================
-- 13. TRIGGERS PARA MANTENER CONSISTENCIA
-- =====================================================

-- Trigger para actualizar stockTotal cuando cambia stock_sucursal
DELIMITER //
CREATE TRIGGER actualizar_stock_total 
AFTER UPDATE ON stock_sucursal
FOR EACH ROW
BEGIN
    UPDATE productos 
    SET stockTotal = (
        SELECT COALESCE(SUM(stockDisponible), 0) 
        FROM stock_sucursal 
        WHERE idProducto = NEW.idProducto
    )
    WHERE idProducto = NEW.idProducto;
END//
DELIMITER ;

-- Trigger para actualizar total del pedido
DELIMITER //
CREATE TRIGGER actualizar_total_pedido 
AFTER INSERT ON detalle_pedidos
FOR EACH ROW
BEGIN
    UPDATE pedidos 
    SET total = (
        SELECT SUM(subtotal) 
        FROM detalle_pedidos 
        WHERE idPedido = NEW.idPedido
    )
    WHERE idPedido = NEW.idPedido;
END//
DELIMITER ;

-- =====================================================
-- 14. VISTAS ÚTILES
-- =====================================================

-- Vista de productos con stock total
CREATE VIEW vista_productos_stock AS
SELECT 
    p.idProducto,
    p.nombre,
    p.descripcion,
    p.precio,
    p.categoria,
    p.stockTotal,
    GROUP_CONCAT(pi.imagen ORDER BY pi.orden) as imagenes,
    COUNT(pi.id) as total_imagenes
FROM productos p
LEFT JOIN producto_imagenes pi ON p.idProducto = pi.producto_id
WHERE p.activo = TRUE
GROUP BY p.idProducto;

-- Vista de servicios con información del usuario
CREATE VIEW vista_servicios_completa AS
SELECT 
    s.*,
    u.nombre,
    u.apellido,
    u.email,
    CASE 
        WHEN s.tipoServicio = 'instalacion' THEN 'Instalación de producto'
        WHEN s.tipoServicio = 'mantenimiento' THEN 'Mantenimiento'
        WHEN s.tipoServicio = 'garantia' THEN 'Arreglo por garantía'
    END as tipoServicioDescripcion
FROM solicitudes_servicio_postventa s
JOIN usuarios u ON s.idUsuario = u.idUsuario;

-- =====================================================
-- 15. DATOS DE PRUEBA ADICIONALES
-- =====================================================

-- Más productos para pruebas
INSERT INTO productos (nombre, descripcion, precio, stockTotal, categoria) VALUES
('Filtro de Agua Industrial', 'Sistema de filtración de agua para uso industrial y doméstico', 35000.00, 20, 'Filtros'),
('Calentador Solar 200L', 'Calentador solar de agua con tanque de 200 litros', 180000.00, 5, 'Energía Solar'),
('Bomba Sumergible 0.5HP', 'Bomba sumergible para pozos profundos', 65000.00, 10, 'Bombas'),
('Regulador de Voltaje 5KVA', 'Regulador automático de voltaje para protección de equipos', 95000.00, 8, 'Reguladores'),
('Hidroneumático 100L', 'Tanque hidroneumático con bomba incluida', 150000.00, 6, 'Sistemas');

-- Stock para los nuevos productos
INSERT INTO stock_sucursal (idSucursal, idProducto, stockDisponible, stockMinimo) VALUES
-- Filtro de Agua Industrial
(1, 6, 7, 3),
(2, 6, 8, 3),
(3, 6, 5, 3),
-- Calentador Solar 200L
(1, 7, 2, 1),
(2, 7, 2, 1),
(3, 7, 1, 1),
-- Bomba Sumergible 0.5HP
(1, 8, 3, 2),
(2, 8, 4, 2),
(3, 8, 3, 2),
-- Regulador de Voltaje 5KVA
(1, 9, 3, 1),
(2, 9, 3, 1),
(3, 9, 2, 1),
-- Hidroneumático 100L
(1, 10, 2, 1),
(2, 10, 2, 1),
(3, 10, 2, 1);

-- =====================================================
-- 16. PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================

-- Procedimiento para crear un pedido completo
DELIMITER //
CREATE PROCEDURE CrearPedido(
    IN p_idCliente INT,
    IN p_idSucursal INT,
    IN p_metodoPago VARCHAR(50),
    IN p_direccionEnvio VARCHAR(500),
    IN p_productos JSON
)
BEGIN
    DECLARE v_idPedido INT;
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_idProducto INT;
    DECLARE v_cantidad INT;
    DECLARE v_precio DECIMAL(10,2);
    
    DECLARE cur CURSOR FOR 
        SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(p_productos, CONCAT('$[', idx, '].idProducto'))) as idProducto,
            JSON_UNQUOTE(JSON_EXTRACT(p_productos, CONCAT('$[', idx, '].cantidad'))) as cantidad
        FROM (
            SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
            UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
        ) numbers
        WHERE JSON_EXTRACT(p_productos, CONCAT('$[', idx, ']')) IS NOT NULL;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    START TRANSACTION;
    
    -- Crear el pedido
    INSERT INTO pedidos (idCliente, idSucursal, total, metodoPago, direccionEnvio)
    VALUES (p_idCliente, p_idSucursal, 0, p_metodoPago, p_direccionEnvio);
    
    SET v_idPedido = LAST_INSERT_ID();
    
    -- Abrir cursor y procesar productos
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_idProducto, v_cantidad;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Obtener precio del producto
        SELECT precio INTO v_precio FROM productos WHERE idProducto = v_idProducto;
        
        -- Insertar detalle del pedido
        INSERT INTO detalle_pedidos (idPedido, idProducto, cantidad, precioUnitario, subtotal)
        VALUES (v_idPedido, v_idProducto, v_cantidad, v_precio, v_precio * v_cantidad);
        
        -- Actualizar stock
        UPDATE stock_sucursal 
        SET stockDisponible = stockDisponible - v_cantidad
        WHERE idSucursal = p_idSucursal AND idProducto = v_idProducto;
        
    END LOOP;
    CLOSE cur;
    
    -- Calcular y actualizar total
    SELECT SUM(subtotal) INTO v_total FROM detalle_pedidos WHERE idPedido = v_idPedido;
    UPDATE pedidos SET total = v_total WHERE idPedido = v_idPedido;
    
    COMMIT;
    
    SELECT v_idPedido as idPedido, v_total as total;
END//
DELIMITER ;

-- =====================================================
-- COMANDOS ÚTILES PARA ADMINISTRACIÓN
-- =====================================================

-- Verificar integridad de stock
-- SELECT 
--     p.idProducto,
--     p.nombre,
--     p.stockTotal as stock_tabla_productos,
--     COALESCE(SUM(ss.stockDisponible), 0) as stock_sum_sucursales
-- FROM productos p
-- LEFT JOIN stock_sucursal ss ON p.idProducto = ss.idProducto
-- GROUP BY p.idProducto
-- HAVING stock_tabla_productos != stock_sum_sucursales;

-- Resumen de servicios por estado
-- SELECT estado, COUNT(*) as cantidad 
-- FROM solicitudes_servicio_postventa 
-- GROUP BY estado;

-- Productos más vendidos
-- SELECT 
--     p.nombre,
--     SUM(dp.cantidad) as total_vendido,
--     SUM(dp.subtotal) as ingresos_totales
-- FROM productos p
-- JOIN detalle_pedidos dp ON p.idProducto = dp.idProducto
-- JOIN pedidos pe ON dp.idPedido = pe.idPedido
-- WHERE pe.estado IN ('entregado', 'confirmado')
-- GROUP BY p.idProducto
-- ORDER BY total_vendido DESC;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Mensaje de confirmación
SELECT 'Base de datos creada exitosamente con todos los datos de ejemplo' as Resultado;