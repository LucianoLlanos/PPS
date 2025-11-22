-- Crea la tabla para almacenar códigos de retiro asociados a pedidos
CREATE TABLE IF NOT EXISTS `retiros_pedido` (
  `idRetiro` INT NOT NULL AUTO_INCREMENT,
  `idPedido` INT NOT NULL,
  `codigo` VARCHAR(16) NOT NULL,
  `telefono` VARCHAR(50) DEFAULT NULL,
  `creadoPor` INT DEFAULT NULL,
  `estado` ENUM('pendiente','entregado','anulado') NOT NULL DEFAULT 'pendiente',
  `creadoEn` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usadoEn` DATETIME DEFAULT NULL,
  PRIMARY KEY (`idRetiro`),
  UNIQUE KEY `uq_retiros_codigo` (`codigo`),
  KEY `idx_retiros_pedido` (`idPedido`),
  CONSTRAINT `fk_retiros_pedido_pedidos` FOREIGN KEY (`idPedido`) REFERENCES `pedidos`(`idPedido`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
