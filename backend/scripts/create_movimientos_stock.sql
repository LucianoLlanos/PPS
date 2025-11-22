-- Migration: create movimientos_stock table
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
