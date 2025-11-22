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
    tokenVersion INT DEFAULT 0,
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

-- Usuario demo para el botón "Demo Admin" del frontend
-- Nota: la contraseña se guarda en texto plano intencionalmente para permitir
-- login inmediato desde el entorno de desarrollo; AuthService migrará la
-- contraseña a bcrypt al primer inicio de sesión exitoso.
INSERT INTO usuarios (nombre, apellido, email, password, idRol) VALUES
('Admin', 'Demo', 'admin@example.com', 'admin123', 3);

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
/*
    Normalizamos productos:
    - Creamos tabla `categorias` y referenciamos `productos.idCategoria` (FK)
    - Mantenemos columna textual `categoria` en productos para compatibilidad
        con código que aún consulta `categoria` como texto. Esta columna se
        actualizará automáticamente desde `idCategoria` mediante triggers.
    - Separación de imágenes en `producto_imagenes` (ya existe) y relaciones
        adicionales para atributos (producto_atributo) para conseguir 3NF+.
*/

CREATE TABLE IF NOT EXISTS categorias (
        idCategoria INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL UNIQUE,
        descripcion TEXT,
        fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
        idProducto INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        stockTotal INT DEFAULT 0,
        imagen VARCHAR(255), -- Imagen principal (compatibilidad)
        idCategoria INT NULL, -- FK a categorias (normalizado)
        categoria VARCHAR(100) NULL, -- campo textual kept for backwards compatibility
        activo BOOLEAN DEFAULT TRUE,
        fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_product_categoria FOREIGN KEY (idCategoria) REFERENCES categorias(idCategoria)
);

-- Nota: la columna textual `categoria` fue eliminada en favor de `idCategoria`.
-- Usamos JOIN con `categorias` para obtener el nombre de categoría cuando es necesario.

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

-- Los productos de ejemplo se insertan más abajo una vez creadas las categorías (evitar duplicados)

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
-- Insertar stock por sucursal de ejemplo
-- Nota: los inserts de stock se mueven más abajo, después de crear los productos,
-- para respetar las constraints FK. Ver sección 15 donde se insertan productos.

-- =====================================================
-- 8. TABLA DE PEDIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS pedidos (
    idPedido INT AUTO_INCREMENT PRIMARY KEY,
    idCliente INT NOT NULL,
    idSucursal INT,
    -- Compatibilidad con código legacy que usa `idSucursalOrigen`
    idSucursalOrigen INT NULL,
    total DECIMAL(10,2) NOT NULL,
    -- Normalizar estados a valores en minúsculas (evita duplicados que rompen integridad lógica)
    estado ENUM('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    metodoPago VARCHAR(50),
    direccionEnvio VARCHAR(500),
    observaciones TEXT,
    -- Columnas de pago / financiación (compatibilidad con scripts existentes)
    cuotas INT DEFAULT 1,
    interes DECIMAL(5,2) DEFAULT 0.00,
    descuento DECIMAL(5,2) DEFAULT 0.00,
    totalConInteres DECIMAL(10,2) DEFAULT NULL,
    -- Compatibilidad con código que consulta `fecha` en lugar de `fechaPedido`
    fechaPedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idCliente) REFERENCES clientes(idCliente),
    FOREIGN KEY (idSucursal) REFERENCES sucursales(idSucursal),
    FOREIGN KEY (idSucursalOrigen) REFERENCES sucursales(idSucursal)
);

-- =====================================================
-- 9. TABLA DE DETALLES DE PEDIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_pedidos (
    idDetalle INT AUTO_INCREMENT PRIMARY KEY,
    -- Columna de compatibilidad usada en varios scripts/admin
    -- Nota: se eliminó la columna generada `idDetallePedido` porque MySQL no
    -- permite que una columna GENERATED dependa de una columna AUTO_INCREMENT.
    -- Para compatibilidad, crear una vista si se necesita el alias `idDetallePedido`.
    idPedido INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    precioUnitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (idPedido) REFERENCES pedidos(idPedido) ON DELETE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES productos(idProducto)
);

-- =====================================================
-- Tabla para códigos de retiro (pedidos físicos / retiradas)
-- Separamos esta entidad para no modificar la tabla `pedidos`.
CREATE TABLE IF NOT EXISTS retiros_pedido (
    idRetiro INT AUTO_INCREMENT PRIMARY KEY,
    idPedido INT NOT NULL,
    codigo VARCHAR(16) NOT NULL,
    telefono VARCHAR(50) DEFAULT NULL,
    creadoPor INT DEFAULT NULL,
    estado ENUM('pendiente','entregado','anulado') NOT NULL DEFAULT 'pendiente',
    creadoEn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usadoEn DATETIME DEFAULT NULL,
    UNIQUE KEY uq_retiros_codigo (codigo),
    KEY idx_retiros_pedido (idPedido),
    CONSTRAINT fk_retiros_pedido_pedidos FOREIGN KEY (idPedido) REFERENCES pedidos(idPedido) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Los INSERT de ejemplo para `pedidos` y `detalle_pedidos` se realizan
-- más abajo, después de crear los `productos` y cargar el stock, para
-- respetar las constraints de clave foránea (idProducto, idCliente).

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
CREATE INDEX idx_productos_idCategoria ON productos(idCategoria);
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

-- Triggers para mantener stockTotal actualizado cuando cambia stock_sucursal
DELIMITER //
CREATE TRIGGER actualizar_stock_total_after_insert
AFTER INSERT ON stock_sucursal
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

CREATE TRIGGER actualizar_stock_total_after_update
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

CREATE TRIGGER actualizar_stock_total_after_delete
AFTER DELETE ON stock_sucursal
FOR EACH ROW
BEGIN
    UPDATE productos
    SET stockTotal = (
        SELECT COALESCE(SUM(stockDisponible), 0)
        FROM stock_sucursal
        WHERE idProducto = OLD.idProducto
    )
    WHERE idProducto = OLD.idProducto;
END//
DELIMITER ;

-- =====================================================
-- Tabla de movimientos de stock (auditoría de transferencias/ajustes)
-- =====================================================
CREATE TABLE IF NOT EXISTS movimientos_stock (
    idMovimiento INT AUTO_INCREMENT PRIMARY KEY,
    idProducto INT NOT NULL,
    fromSucursal INT NULL,
    toSucursal INT NULL,
    cantidad INT NOT NULL,
    tipo ENUM('transfer','entrada','salida','ajuste') NOT NULL DEFAULT 'ajuste',
    idUsuario INT NULL,
    nota TEXT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (idProducto),
    INDEX (fromSucursal),
    INDEX (toSucursal)
);


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

-- (Los triggers específicos de sincronización de `productos.categoria` con `categorias`
-- se definen después de crear `categorias` y `productos` en la sección de datos,
-- para evitar errores de orden durante la importación.)

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
    COALESCE(c.nombre, '') AS categoria,
    p.stockTotal,
    GROUP_CONCAT(pi.imagen ORDER BY pi.orden) as imagenes,
    COUNT(pi.id) as total_imagenes
FROM productos p
LEFT JOIN categorias c ON p.idCategoria = c.idCategoria
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

-- Vista de pedidos para compatibilidad: expone `fechaPedido` como `fecha`
CREATE VIEW pedidos_view AS
SELECT p.*, p.fechaPedido AS fecha
FROM pedidos p;

-- =====================================================
-- TABLAS AUXILIARES / COMPATIBILIDAD
-- =====================================================

-- Banners / Carousel (nombre utilizado en repositorio: banners_carousel)
CREATE TABLE IF NOT EXISTS banners_carousel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255),
    descripcion TEXT,
    imagen VARCHAR(255),
    enlace VARCHAR(255),
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para recuperación de contraseña (tokens de un sólo uso, guardamos hash)
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    ip_request VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_usuario (idUsuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Favoritos de usuario
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    idProducto INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario) ON DELETE CASCADE,
    FOREIGN KEY (idProducto) REFERENCES productos(idProducto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Información de la empresa
CREATE TABLE IF NOT EXISTS empresa_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vision TEXT,
    mision TEXT,
    composicion TEXT,
    archivo_pdf VARCHAR(255),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    actualizado_por VARCHAR(100)
);

-- =====================================================
--  Additional: Tabla de notificaciones para administradores
-- =====================================================
CREATE TABLE IF NOT EXISTS notificaciones (
    idNotificacion INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    referenciaId INT NULL,
    mensaje TEXT NOT NULL,
    destinatarioRol VARCHAR(50) DEFAULT 'Administrador',
    destinatarioId INT NULL,
    estado ENUM('pendiente','leida') DEFAULT 'pendiente',
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    INDEX idx_notif_destino (destinatarioRol, destinatarioId),
    INDEX idx_notif_estado (estado),
    INDEX idx_notif_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cargos/organización
CREATE TABLE IF NOT EXISTS organizacion_cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cargo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    nivel_jerarquico INT DEFAULT 0,
    foto VARCHAR(255),
    orden_en_nivel INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- 15. DATOS DE PRUEBA ADICIONALES
-- =====================================================

-- Más productos para pruebas
-- Insertar categorías primero y luego productos referenciando idCategoria
INSERT INTO categorias (nombre, descripcion) VALUES
('Bombas', 'Bombas centrífugas y sumergibles'),
('Energía Solar', 'Paneles e inversores solares'),
('Tanques', 'Tanques de almacenamiento'),
('Motores', 'Motores eléctricos'),
('Filtros', 'Sistemas de filtrado y purificación');

-- Insertar productos asociando idCategoria
INSERT INTO productos (nombre, descripcion, precio, stockTotal, idCategoria) VALUES
('Bomba de Agua 1HP', 'Bomba centrífuga para uso doméstico e industrial. Ideal para extracción de agua de pozos y cisternas.', 45000.00, 15, (SELECT idCategoria FROM categorias WHERE nombre='Bombas' LIMIT 1)),
('Panel Solar 300W', 'Panel solar fotovoltaico de alta eficiencia. Ideal para sistemas de energía renovable.', 85000.00, 8, (SELECT idCategoria FROM categorias WHERE nombre='Energía Solar' LIMIT 1)),
('Tanque de Agua 1000L', 'Tanque de polietileno de alta resistencia para almacenamiento de agua potable.', 60000.00, 12, (SELECT idCategoria FROM categorias WHERE nombre='Tanques' LIMIT 1)),
('Motor Eléctrico 2HP', 'Motor eléctrico trifásico de alta eficiencia para uso industrial.', 120000.00, 6, (SELECT idCategoria FROM categorias WHERE nombre='Motores' LIMIT 1)),
('Inversor Solar 5KW', 'Inversor de corriente para sistemas solares fotovoltaicos residenciales.', 200000.00, 4, (SELECT idCategoria FROM categorias WHERE nombre='Energía Solar' LIMIT 1));

-- Productos adicionales (ids 6..10) necesarios para los inserts de `stock_sucursal` que siguen
INSERT INTO productos (nombre, descripcion, precio, stockTotal, idCategoria) VALUES
('Filtro de Agua Industrial', 'Filtro de cartucho industrial para tratamiento de agua.', 35000.00, 10, (SELECT idCategoria FROM categorias WHERE nombre='Filtros' LIMIT 1)),
('Calentador Solar 200L', 'Calentador solar de 200 litros para agua sanitaria.', 95000.00, 4, (SELECT idCategoria FROM categorias WHERE nombre='Energía Solar' LIMIT 1)),
('Bomba Sumergible 0.5HP', 'Bomba sumergible compacta para pozos y cisternas pequeñas.', 25000.00, 6, (SELECT idCategoria FROM categorias WHERE nombre='Bombas' LIMIT 1)),
('Regulador de Voltaje 5KVA', 'Regulador/estabilizador de voltaje 5KVA para equipos sensibles.', 50000.00, 5, (SELECT idCategoria FROM categorias WHERE nombre='Motores' LIMIT 1)),
('Hidroneumático 100L', 'Equipo hidroneumático de 100 litros para almacenamiento y presión.', 80000.00, 3, (SELECT idCategoria FROM categorias WHERE nombre='Tanques' LIMIT 1));

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

-- Insertar stock por sucursal para los primeros productos (ids 1..5)
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

-- Insertar pedidos de ejemplo (desplazado aquí para respetar FK con `productos`)
INSERT INTO pedidos (idCliente, idSucursal, idSucursalOrigen, total, estado, metodoPago, direccionEnvio) VALUES
-- Ajustado: los idCliente son los AUTO_INCREMENT generados en la tabla clientes (1 y 2)
(1, 1, 1, 45000.00, 'entregado', 'transferencia', 'Av. Corrientes 1234, CABA'),
(2, 2, 2, 145000.00, 'confirmado', 'efectivo', 'Av. Santa Fe 5678, CABA');

-- Insertar detalles de pedidos (desplazado aquí para respetar FK con `productos`)
INSERT INTO detalle_pedidos (idPedido, idProducto, cantidad, precioUnitario, subtotal) VALUES
(1, 1, 1, 45000.00, 45000.00),
(2, 2, 1, 85000.00, 85000.00),
(2, 3, 1, 60000.00, 60000.00);

-- Triggers para mantener `productos.categoria` sincronizado con `categorias.nombre`
DELIMITER //
CREATE TRIGGER productos_set_categoria_before_insert
BEFORE INSERT ON productos
FOR EACH ROW
BEGIN
    IF NEW.idCategoria IS NOT NULL THEN
        SET NEW.categoria = (SELECT nombre FROM categorias WHERE idCategoria = NEW.idCategoria LIMIT 1);
    END IF;
END//

CREATE TRIGGER productos_set_categoria_before_update
BEFORE UPDATE ON productos
FOR EACH ROW
BEGIN
    IF NEW.idCategoria IS NOT NULL THEN
        SET NEW.categoria = (SELECT nombre FROM categorias WHERE idCategoria = NEW.idCategoria LIMIT 1);
    ELSE
        SET NEW.categoria = NULL;
    END IF;
END//

CREATE TRIGGER categorias_after_update
AFTER UPDATE ON categorias
FOR EACH ROW
BEGIN
    IF OLD.nombre <> NEW.nombre THEN
        UPDATE productos SET categoria = NEW.nombre WHERE idCategoria = NEW.idCategoria;
    END IF;
END//
DELIMITER ;

-- =====================================================
-- 16. PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================
-- Procedimiento para recalcular stockTotal de todos los productos
DELIMITER //
CREATE PROCEDURE RecalculateAllStock()
BEGIN
    -- Recorremos los productos y actualizamos por clave primaria (idProducto).
    -- Esto evita ejecutar un UPDATE masivo sin WHERE y es compatible con
    -- clientes/configuraciones que activan "safe update mode".
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_idProducto INT;
    DECLARE cur CURSOR FOR SELECT idProducto FROM productos;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_idProducto;
        IF done THEN
            LEAVE read_loop;
        END IF;

        UPDATE productos
        SET stockTotal = (
            SELECT COALESCE(SUM(ss.stockDisponible), 0)
            FROM stock_sucursal ss
            WHERE ss.idProducto = v_idProducto
        )
        WHERE idProducto = v_idProducto;

    END LOOP;
    CLOSE cur;
END//
DELIMITER ;

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

/*
    NOTAS DE MIGRACIÓN / COMPATIBILIDAD:
    - El esquema ahora usa `categorias` + `productos.idCategoria` para normalizar.
    - Para compatibilidad con código que espera `productos.categoria` (texto),
        se creó triggers BEFORE INSERT/UPDATE que rellenan `categoria` desde
        `categorias.nombre` cuando `idCategoria` está presente.
    - Si en tu entorno existe una tabla `products` (en inglés) usada por servicios
        de prueba, revisa y elimina/mapea esa tabla preferentemente hacia `productos`.
*/

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
-- Recalcular stockTotal una vez finalizada la importación para garantizar consistencia
-- Algunos clientes (p. ej. MySQL Workbench) usan "safe update mode" y bloquean
-- actualizaciones que no incluyen un WHERE con una KEY. Para hacer la importación
-- robusta, desactivamos temporalmente `sql_safe_updates` solo para este CALL.
SET @__old_sql_safe_updates = @@sql_safe_updates;
SET SESSION sql_safe_updates = 0;
CALL RecalculateAllStock();
SET SESSION sql_safe_updates = @__old_sql_safe_updates;

SELECT 'Base de datos creada exitosamente con todos los datos de ejemplo' as Resultado;