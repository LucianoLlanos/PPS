-- Agregar columnas para detalles de pago con cuotas e intereses
USE atilio_marola;

-- Verificar y agregar columna cuotas
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_name = 'pedidos'
   AND table_schema = DATABASE()
   AND column_name = 'cuotas') > 0,
  'SELECT 1',
  'ALTER TABLE pedidos ADD COLUMN cuotas INT DEFAULT 1'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar columna interes
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_name = 'pedidos'
   AND table_schema = DATABASE()
   AND column_name = 'interes') > 0,
  'SELECT 1',
  'ALTER TABLE pedidos ADD COLUMN interes DECIMAL(5,2) DEFAULT 0.00'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar columna descuento
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_name = 'pedidos'
   AND table_schema = DATABASE()
   AND column_name = 'descuento') > 0,
  'SELECT 1',
  'ALTER TABLE pedidos ADD COLUMN descuento DECIMAL(5,2) DEFAULT 0.00'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar y agregar columna totalConInteres
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_name = 'pedidos'
   AND table_schema = DATABASE()
   AND column_name = 'totalConInteres') > 0,
  'SELECT 1',
  'ALTER TABLE pedidos ADD COLUMN totalConInteres DECIMAL(10,2)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Actualizar registros existentes donde las columnas sean NULL
UPDATE pedidos SET cuotas = 1 WHERE cuotas IS NULL;
UPDATE pedidos SET interes = 0.00 WHERE interes IS NULL;
UPDATE pedidos SET descuento = 0.00 WHERE descuento IS NULL;
UPDATE pedidos SET totalConInteres = total WHERE totalConInteres IS NULL;
