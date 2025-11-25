-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: atilio_marola
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `banners_carousel`
--

DROP TABLE IF EXISTS `banners_carousel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners_carousel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `imagen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enlace` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orden` int DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners_carousel`
--

LOCK TABLES `banners_carousel` WRITE;
/*!40000 ALTER TABLE `banners_carousel` DISABLE KEYS */;
INSERT INTO `banners_carousel` VALUES (1,'La Mejor Calidad',NULL,'1763820294804-716454527.jpg',NULL,0,1,'2025-11-22 14:02:57','2025-11-22 14:04:54'),(2,'Los Mejores Precios',NULL,'1763820205930-161772349.jpg',NULL,1,1,'2025-11-22 14:03:25','2025-11-22 14:03:25'),(3,'Las Mejores Marcas',NULL,'1763820240323-698726706.jpg',NULL,2,1,'2025-11-22 14:04:00','2025-11-22 14:04:00');
/*!40000 ALTER TABLE `banners_carousel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `idCategoria` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text,
  `fechaCreacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCategoria`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Bombas','Bombas centrífugas y sumergibles','2025-11-22 13:16:06'),(2,'Energía Solar','Paneles e inversores solares','2025-11-22 13:16:06'),(3,'Tanques','Tanques de almacenamiento','2025-11-22 13:16:06'),(4,'Motores','Motores eléctricos','2025-11-22 13:16:06'),(5,'Filtros','Sistemas de filtrado y purificación','2025-11-22 13:16:06');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `categorias_after_update` AFTER UPDATE ON `categorias` FOR EACH ROW BEGIN
    IF OLD.nombre <> NEW.nombre THEN
        UPDATE productos SET categoria = NEW.nombre WHERE idCategoria = NEW.idCategoria;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `idCliente` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `direccion` varchar(500) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fechaNacimiento` date DEFAULT NULL,
  PRIMARY KEY (`idCliente`),
  UNIQUE KEY `idUsuario` (`idUsuario`),
  CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`idUsuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,2,'Av. Corrientes 1234, CABA','+54 11 1234-5678',NULL),(2,3,'Av. Santa Fe 5678, CABA','+54 11 8765-4321',NULL),(3,6,NULL,'03813007987',NULL),(4,8,'Juan Bautista Alberdi','3813007987',NULL),(5,9,'las lomas 34','3816437894',NULL);
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_pedidos`
--

DROP TABLE IF EXISTS `detalle_pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_pedidos` (
  `idDetalle` int NOT NULL AUTO_INCREMENT,
  `idPedido` int NOT NULL,
  `idProducto` int NOT NULL,
  `cantidad` int NOT NULL,
  `precioUnitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`idDetalle`),
  KEY `idPedido` (`idPedido`),
  KEY `idProducto` (`idProducto`),
  CONSTRAINT `detalle_pedidos_ibfk_1` FOREIGN KEY (`idPedido`) REFERENCES `pedidos` (`idPedido`) ON DELETE CASCADE,
  CONSTRAINT `detalle_pedidos_ibfk_2` FOREIGN KEY (`idProducto`) REFERENCES `productos` (`idProducto`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_pedidos`
--

LOCK TABLES `detalle_pedidos` WRITE;
/*!40000 ALTER TABLE `detalle_pedidos` DISABLE KEYS */;
INSERT INTO `detalle_pedidos` VALUES (1,1,1,1,45000.00,45000.00),(2,2,2,1,85000.00,85000.00),(3,2,3,1,60000.00,60000.00),(4,3,7,1,95000.00,95000.00),(5,3,3,1,60000.00,60000.00),(6,4,8,1,25000.00,25000.00),(7,5,9,1,50000.00,50000.00),(8,6,2,1,85000.00,85000.00),(9,6,6,1,35000.00,35000.00),(10,6,5,1,200000.00,200000.00),(11,7,10,1,80000.00,80000.00);
/*!40000 ALTER TABLE `detalle_pedidos` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `actualizar_total_pedido` AFTER INSERT ON `detalle_pedidos` FOR EACH ROW BEGIN
    UPDATE pedidos 
    SET total = (
        SELECT SUM(subtotal) 
        FROM detalle_pedidos 
        WHERE idPedido = NEW.idPedido
    )
    WHERE idPedido = NEW.idPedido;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `empresa_info`
--

DROP TABLE IF EXISTS `empresa_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresa_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vision` text,
  `mision` text,
  `composicion` text,
  `archivo_pdf` varchar(255) DEFAULT NULL,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `actualizado_por` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresa_info`
--

LOCK TABLES `empresa_info` WRITE;
/*!40000 ALTER TABLE `empresa_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `empresa_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial`
--

DROP TABLE IF EXISTS `historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial` (
  `idHistorial` int NOT NULL AUTO_INCREMENT,
  `tabla` varchar(50) NOT NULL,
  `idRegistro` int NOT NULL,
  `accion` enum('crear','actualizar','eliminar') NOT NULL,
  `usuario` varchar(255) DEFAULT NULL,
  `descripcion` text,
  `fechaAccion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idHistorial`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial`
--

LOCK TABLES `historial` WRITE;
/*!40000 ALTER TABLE `historial` DISABLE KEYS */;
INSERT INTO `historial` VALUES (1,'usuarios',7,'crear','vendedor@gmail.com','Usuario creado: Martin Cirio','2025-11-22 14:16:44');
/*!40000 ALTER TABLE `historial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_stock`
--

DROP TABLE IF EXISTS `movimientos_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_stock` (
  `idMovimiento` int NOT NULL AUTO_INCREMENT,
  `idProducto` int NOT NULL,
  `fromSucursal` int DEFAULT NULL,
  `toSucursal` int DEFAULT NULL,
  `cantidad` int NOT NULL,
  `tipo` enum('transfer','entrada','salida','ajuste') NOT NULL DEFAULT 'ajuste',
  `idUsuario` int DEFAULT NULL,
  `nota` text,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idMovimiento`),
  KEY `idProducto` (`idProducto`),
  KEY `fromSucursal` (`fromSucursal`),
  KEY `toSucursal` (`toSucursal`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_stock`
--

LOCK TABLES `movimientos_stock` WRITE;
/*!40000 ALTER TABLE `movimientos_stock` DISABLE KEYS */;
INSERT INTO `movimientos_stock` VALUES (1,1,NULL,1,1,'ajuste',NULL,'Ajuste desde edición de producto','2025-11-22 10:53:28'),(2,1,NULL,3,1,'ajuste',NULL,'Ajuste desde edición de producto','2025-11-22 10:53:28'),(3,1,1,2,1,'transfer',5,NULL,'2025-11-22 10:54:32');
/*!40000 ALTER TABLE `movimientos_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `idNotificacion` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referenciaId` int DEFAULT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `destinatarioRol` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Administrador',
  `destinatarioId` int DEFAULT NULL,
  `estado` enum('pendiente','leida') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idNotificacion`),
  KEY `idx_notif_destino` (`destinatarioRol`,`destinatarioId`),
  KEY `idx_notif_estado` (`estado`),
  KEY `idx_notif_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,'pedido',3,'Nuevo pedido #3 - total $155000','Administrador',NULL,'leida','{\"total\": 155000}','2025-11-22 14:07:29','2025-11-22 14:14:15'),(2,'servicio',4,'Nueva solicitud de servicio (instalacion) de Luciano Llanos','Administrador',NULL,'leida','{\"idUsuario\": 6}','2025-11-22 14:08:50','2025-11-22 14:14:08'),(3,'pedido',4,'Nuevo pedido #4 - total $28750','Administrador',NULL,'leida','{\"total\": 28750}','2025-11-22 14:09:57','2025-11-22 14:14:02'),(4,'pedido',5,'Nuevo pedido #5 - total $47500','Administrador',NULL,'leida','{\"total\": 47500}','2025-11-22 14:10:28','2025-11-22 14:13:47'),(5,'pedido',6,'Nuevo pedido #6 - total $320000','Administrador',NULL,'leida','{\"total\": 320000}','2025-11-22 14:18:35','2025-11-22 14:26:10'),(6,'pedido',7,'Nuevo pedido #7 - total $80000','Administrador',NULL,'leida','{\"total\": 80000}','2025-11-22 14:21:33','2025-11-22 14:25:55'),(7,'servicio',5,'Nueva solicitud de servicio (instalacion) de Luciano Llanos','Administrador',NULL,'leida','{\"idUsuario\": 6}','2025-11-22 14:52:57','2025-11-22 15:17:01'),(8,'servicio',6,'Nueva solicitud de servicio (instalacion) de Luciano Llanos','Administrador',NULL,'leida','{\"idUsuario\": 6}','2025-11-22 15:16:26','2025-11-22 15:17:33');
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizacion_cargos`
--

DROP TABLE IF EXISTS `organizacion_cargos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizacion_cargos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_cargo` varchar(255) NOT NULL,
  `descripcion` text,
  `nivel_jerarquico` int DEFAULT '0',
  `foto` varchar(255) DEFAULT NULL,
  `orden_en_nivel` int DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizacion_cargos`
--

LOCK TABLES `organizacion_cargos` WRITE;
/*!40000 ALTER TABLE `organizacion_cargos` DISABLE KEYS */;
/*!40000 ALTER TABLE `organizacion_cargos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `ip_request` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_token_hash` (`token_hash`),
  KEY `idx_usuario` (`idUsuario`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`idUsuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES (1,6,'5dfa54dff0de0fa7d41ce1f1878e55314f2d6e2f0a46efeef07c868f12fb21ac','2025-11-22 14:10:47','2025-11-22 12:10:48',0,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `idPedido` int NOT NULL AUTO_INCREMENT,
  `idCliente` int NOT NULL,
  `idSucursal` int DEFAULT NULL,
  `idSucursalOrigen` int DEFAULT NULL,
  `total` decimal(10,2) NOT NULL,
  `estado` enum('pendiente','confirmado','preparando','enviado','entregado','cancelado') DEFAULT 'pendiente',
  `metodoPago` varchar(50) DEFAULT NULL,
  `direccionEnvio` varchar(500) DEFAULT NULL,
  `observaciones` text,
  `cuotas` int DEFAULT '1',
  `interes` decimal(5,2) DEFAULT '0.00',
  `descuento` decimal(5,2) DEFAULT '0.00',
  `totalConInteres` decimal(10,2) DEFAULT NULL,
  `fechaPedido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaActualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPedido`),
  KEY `idSucursal` (`idSucursal`),
  KEY `idSucursalOrigen` (`idSucursalOrigen`),
  KEY `idx_pedidos_cliente` (`idCliente`),
  KEY `idx_pedidos_estado` (`estado`),
  KEY `idx_pedidos_fecha` (`fechaPedido`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`idCliente`) REFERENCES `clientes` (`idCliente`),
  CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`idSucursal`) REFERENCES `sucursales` (`idSucursal`),
  CONSTRAINT `pedidos_ibfk_3` FOREIGN KEY (`idSucursalOrigen`) REFERENCES `sucursales` (`idSucursal`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (1,1,1,1,45000.00,'entregado','transferencia','Av. Corrientes 1234, CABA',NULL,1,0.00,0.00,NULL,'2025-11-22 13:17:11','2025-11-22 13:17:11'),(2,2,2,2,145000.00,'confirmado','efectivo','Av. Santa Fe 5678, CABA',NULL,1,0.00,0.00,NULL,'2025-11-22 13:17:11','2025-11-22 13:17:14'),(3,3,NULL,1,155000.00,'entregado','Transferencia',NULL,NULL,1,0.00,0.00,155000.00,'2025-11-22 14:07:29','2025-11-22 14:14:26'),(4,3,NULL,1,28750.00,'pendiente','Tarjeta de crédito',NULL,NULL,6,15.00,0.00,28750.00,'2025-11-22 14:09:57','2025-11-22 14:09:57'),(5,3,NULL,1,47500.00,'pendiente','Efectivo',NULL,NULL,1,0.00,5.00,47500.00,'2025-11-22 14:10:28','2025-11-22 14:10:28'),(6,4,NULL,2,320000.00,'entregado','Efectivo',NULL,'Pago: Efectivo',1,0.00,5.00,304000.00,'2025-11-22 14:18:35','2025-11-22 14:18:35'),(7,5,NULL,2,80000.00,'pendiente','Tarjeta de crédito',NULL,'Pago: Tarjeta de crédito',3,10.00,0.00,88000.00,'2025-11-22 14:21:33','2025-11-22 14:21:33');
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `pedidos_view`
--

DROP TABLE IF EXISTS `pedidos_view`;
/*!50001 DROP VIEW IF EXISTS `pedidos_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `pedidos_view` AS SELECT 
 1 AS `idPedido`,
 1 AS `idCliente`,
 1 AS `idSucursal`,
 1 AS `idSucursalOrigen`,
 1 AS `total`,
 1 AS `estado`,
 1 AS `metodoPago`,
 1 AS `direccionEnvio`,
 1 AS `observaciones`,
 1 AS `cuotas`,
 1 AS `interes`,
 1 AS `descuento`,
 1 AS `totalConInteres`,
 1 AS `fechaPedido`,
 1 AS `fechaActualizacion`,
 1 AS `fecha`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `producto_imagenes`
--

DROP TABLE IF EXISTS `producto_imagenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto_imagenes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `imagen` varchar(255) NOT NULL,
  `orden` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_producto_orden` (`producto_id`,`orden`),
  CONSTRAINT `producto_imagenes_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`idProducto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto_imagenes`
--

LOCK TABLES `producto_imagenes` WRITE;
/*!40000 ALTER TABLE `producto_imagenes` DISABLE KEYS */;
INSERT INTO `producto_imagenes` VALUES (1,1,'1763817900784-379816155.png',0,'2025-11-22 13:25:00'),(2,1,'1763817900785-697716470.jpg',1,'2025-11-22 13:25:00'),(3,1,'1763817900785-635238581.jpg',2,'2025-11-22 13:25:00'),(4,2,'1763818081902-843928907.jpg',0,'2025-11-22 13:28:01'),(5,2,'1763818081903-794421636.jpg',1,'2025-11-22 13:28:01'),(6,2,'1763818081903-361151851.jpg',2,'2025-11-22 13:28:01'),(7,3,'1763818096841-142813170.jpg',0,'2025-11-22 13:28:16'),(8,3,'1763818096841-36132508.jpg',1,'2025-11-22 13:28:16'),(9,3,'1763818096841-806901561.jpg',2,'2025-11-22 13:28:16'),(10,4,'1763818501588-897805349.jpg',0,'2025-11-22 13:35:01'),(11,4,'1763818501589-49103398.jpg',1,'2025-11-22 13:35:01'),(12,4,'1763818501589-190425974.jpg',2,'2025-11-22 13:35:01'),(13,5,'1763818695501-626925303.jpg',0,'2025-11-22 13:38:15'),(14,5,'1763818695501-698940531.jpg',1,'2025-11-22 13:38:15'),(15,5,'1763818695501-251835266.jpg',2,'2025-11-22 13:38:15'),(16,6,'1763818868469-207601283.jpg',0,'2025-11-22 13:41:08'),(17,6,'1763818868469-377832900.jpg',1,'2025-11-22 13:41:08'),(18,6,'1763818868469-969984016.jpg',2,'2025-11-22 13:41:08'),(19,7,'1763818984235-432623382.jpg',0,'2025-11-22 13:43:04'),(20,7,'1763818984239-897519881.jpg',1,'2025-11-22 13:43:04'),(21,7,'1763818984240-723306322.jpg',2,'2025-11-22 13:43:04'),(22,8,'1763819175758-490791694.jpg',0,'2025-11-22 13:46:15'),(23,8,'1763819175759-415363036.jpg',1,'2025-11-22 13:46:15'),(24,8,'1763819175759-672539083.jpg',2,'2025-11-22 13:46:15'),(25,9,'1763819388435-586362161.jpg',0,'2025-11-22 13:49:48'),(26,9,'1763819388436-330825261.jpg',1,'2025-11-22 13:49:48'),(27,9,'1763819388436-303606100.jpg',2,'2025-11-22 13:49:48'),(28,10,'1763819507375-235049384.jpg',0,'2025-11-22 13:51:47'),(29,10,'1763819507375-239086306.jpg',1,'2025-11-22 13:51:47'),(30,10,'1763819507411-47343975.jpg',2,'2025-11-22 13:51:47');
/*!40000 ALTER TABLE `producto_imagenes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `idProducto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  `precio` decimal(10,2) NOT NULL,
  `stockTotal` int DEFAULT '0',
  `imagen` varchar(255) DEFAULT NULL,
  `idCategoria` int DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fechaCreacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaActualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idProducto`),
  KEY `idx_productos_idCategoria` (`idCategoria`),
  KEY `idx_productos_activo` (`activo`),
  KEY `idx_productos_precio` (`precio`),
  CONSTRAINT `fk_product_categoria` FOREIGN KEY (`idCategoria`) REFERENCES `categorias` (`idCategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'Bomba de Agua 1HP','Bomba centrífuga para uso doméstico e industrial. Ideal para extracción de agua de pozos y cisternas.',45000.00,17,'1763817900784-379816155.png',1,'Bombas',1,'2025-11-22 13:16:13','2025-11-22 13:54:32'),(2,'Panel Solar 300W','Panel solar fotovoltaico de alta eficiencia. Ideal para sistemas de energía renovable.',85000.00,7,'1763818081902-843928907.jpg',2,'Energía Solar',1,'2025-11-22 13:16:13','2025-11-22 14:18:35'),(3,'Tanque de Agua 1000L','Tanque de polietileno de alta resistencia para almacenamiento de agua potable.',60000.00,12,'1763818096841-142813170.jpg',3,'Tanques',1,'2025-11-22 13:16:13','2025-11-22 13:28:16'),(4,'Motor Eléctrico 2HP','Motor eléctrico trifásico de alta eficiencia para uso industrial.',120000.00,6,'1763818501588-897805349.jpg',4,'Motores',1,'2025-11-22 13:16:13','2025-11-22 13:35:01'),(5,'Inversor Solar 5KW','Inversor de corriente para sistemas solares fotovoltaicos residenciales.',200000.00,3,'1763818695501-626925303.jpg',2,'Energía Solar',1,'2025-11-22 13:16:13','2025-11-22 14:18:35'),(6,'Filtro de Agua Industrial','Filtro de cartucho industrial para tratamiento de agua.',35000.00,19,'1763818868469-207601283.jpg',5,'Filtros',1,'2025-11-22 13:16:25','2025-11-22 14:18:35'),(7,'Calentador Solar 200L','Calentador solar de 200 litros para agua sanitaria.',95000.00,5,'1763818984235-432623382.jpg',2,'Energía Solar',1,'2025-11-22 13:16:25','2025-11-22 13:43:04'),(8,'Bomba Sumergible 0.5HP','Bomba sumergible compacta para pozos y cisternas pequeñas.',25000.00,10,'1763819175758-490791694.jpg',1,'Bombas',1,'2025-11-22 13:16:25','2025-11-22 13:46:15'),(9,'Regulador de Voltaje 5KVA','Regulador/estabilizador de voltaje 5KVA para equipos sensibles.',50000.00,8,'1763819388435-586362161.jpg',4,'Motores',1,'2025-11-22 13:16:25','2025-11-22 13:49:48'),(10,'Hidroneumático 100L','Equipo hidroneumático de 100 litros para almacenamiento y presión.',80000.00,5,'1763819507375-235049384.jpg',3,'Tanques',1,'2025-11-22 13:16:25','2025-11-22 14:21:33');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `productos_set_categoria_before_insert` BEFORE INSERT ON `productos` FOR EACH ROW BEGIN
    IF NEW.idCategoria IS NOT NULL THEN
        SET NEW.categoria = (SELECT nombre FROM categorias WHERE idCategoria = NEW.idCategoria LIMIT 1);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `productos_set_categoria_before_update` BEFORE UPDATE ON `productos` FOR EACH ROW BEGIN
    IF NEW.idCategoria IS NOT NULL THEN
        SET NEW.categoria = (SELECT nombre FROM categorias WHERE idCategoria = NEW.idCategoria LIMIT 1);
    ELSE
        SET NEW.categoria = NULL;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `retiros_pedido`
--

DROP TABLE IF EXISTS `retiros_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `retiros_pedido` (
  `idRetiro` int NOT NULL AUTO_INCREMENT,
  `idPedido` int NOT NULL,
  `codigo` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creadoPor` int DEFAULT NULL,
  `estado` enum('pendiente','entregado','anulado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `creadoEn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usadoEn` datetime DEFAULT NULL,
  PRIMARY KEY (`idRetiro`),
  UNIQUE KEY `uq_retiros_codigo` (`codigo`),
  KEY `idx_retiros_pedido` (`idPedido`),
  CONSTRAINT `fk_retiros_pedido_pedidos` FOREIGN KEY (`idPedido`) REFERENCES `pedidos` (`idPedido`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `retiros_pedido`
--

LOCK TABLES `retiros_pedido` WRITE;
/*!40000 ALTER TABLE `retiros_pedido` DISABLE KEYS */;
INSERT INTO `retiros_pedido` VALUES (1,6,'447833','3813007987',7,'pendiente','2025-11-22 11:18:35',NULL),(2,7,'102372','3816437894',7,'pendiente','2025-11-22 11:21:33',NULL);
/*!40000 ALTER TABLE `retiros_pedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `idRol` int NOT NULL AUTO_INCREMENT,
  `nombreRol` varchar(50) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`idRol`),
  UNIQUE KEY `nombreRol` (`nombreRol`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Cliente','Usuario que puede comprar productos y solicitar servicios'),(2,'Vendedor','Usuario que puede gestionar ventas y productos'),(3,'Administrador','Usuario con acceso completo al sistema');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes_servicio_postventa`
--

DROP TABLE IF EXISTS `solicitudes_servicio_postventa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_servicio_postventa` (
  `idSolicitud` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `tipoServicio` enum('instalacion','mantenimiento','garantia') NOT NULL,
  `descripcion` text NOT NULL,
  `direccion` varchar(500) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fechaPreferida` date DEFAULT NULL,
  `horaPreferida` time DEFAULT NULL,
  `estado` enum('pendiente','confirmado','en_proceso','completado','cancelado') DEFAULT 'pendiente',
  `observacionesAdmin` text,
  `fechaCreacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaActualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idSolicitud`),
  KEY `idx_servicios_usuario` (`idUsuario`),
  KEY `idx_servicios_estado` (`estado`),
  KEY `idx_servicios_tipo` (`tipoServicio`),
  KEY `idx_servicios_fecha_creacion` (`fechaCreacion`),
  CONSTRAINT `solicitudes_servicio_postventa_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`idUsuario`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_servicio_postventa`
--

LOCK TABLES `solicitudes_servicio_postventa` WRITE;
/*!40000 ALTER TABLE `solicitudes_servicio_postventa` DISABLE KEYS */;
INSERT INTO `solicitudes_servicio_postventa` VALUES (1,2,'instalacion','Instalación de bomba de agua 1HP en casa quinta','Av. Corrientes 1234, CABA','+54 11 1234-5678','2025-10-25','14:00:00','pendiente',NULL,'2025-11-22 13:13:21','2025-11-22 13:13:21'),(2,3,'mantenimiento','Mantenimiento preventivo de panel solar','Av. Santa Fe 5678, CABA','+54 11 8765-4321','2025-10-26','09:00:00','confirmado',NULL,'2025-11-22 13:13:21','2025-11-22 13:13:21'),(3,2,'garantia','Revisión de motor eléctrico por ruidos extraños','Av. Corrientes 1234, CABA','+54 11 1234-5678','2025-10-24','16:00:00','en_proceso',NULL,'2025-11-22 13:13:21','2025-11-22 13:13:21'),(4,6,'instalacion','quisiera hacer la instalacion de un tanque de agua ','calle 25 y calle 12','3813259224','2025-11-25','16:00:00','pendiente',NULL,'2025-11-22 14:08:50','2025-11-22 14:08:50'),(5,6,'instalacion','instalar las bombas de agua ','san javier ','3813007987','2025-11-24','15:00:00','pendiente',NULL,'2025-11-22 14:52:57','2025-11-22 14:52:57'),(6,6,'instalacion','necesito la instalacion de el motor','san javier ','3813007987','2025-11-25','17:00:00','pendiente',NULL,'2025-11-22 15:16:26','2025-11-22 15:16:26');
/*!40000 ALTER TABLE `solicitudes_servicio_postventa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_sucursal`
--

DROP TABLE IF EXISTS `stock_sucursal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_sucursal` (
  `idStock` int NOT NULL AUTO_INCREMENT,
  `idSucursal` int NOT NULL,
  `idProducto` int NOT NULL,
  `stockDisponible` int DEFAULT '0',
  `stockMinimo` int DEFAULT '5',
  `fechaActualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idStock`),
  UNIQUE KEY `unique_sucursal_producto` (`idSucursal`,`idProducto`),
  KEY `idProducto` (`idProducto`),
  CONSTRAINT `stock_sucursal_ibfk_1` FOREIGN KEY (`idSucursal`) REFERENCES `sucursales` (`idSucursal`),
  CONSTRAINT `stock_sucursal_ibfk_2` FOREIGN KEY (`idProducto`) REFERENCES `productos` (`idProducto`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_sucursal`
--

LOCK TABLES `stock_sucursal` WRITE;
/*!40000 ALTER TABLE `stock_sucursal` DISABLE KEYS */;
INSERT INTO `stock_sucursal` VALUES (1,1,6,7,3,'2025-11-22 13:16:38'),(2,2,6,7,3,'2025-11-22 14:18:35'),(3,3,6,5,3,'2025-11-22 13:16:38'),(4,1,7,2,1,'2025-11-22 13:16:38'),(5,2,7,2,1,'2025-11-22 13:16:38'),(6,3,7,1,1,'2025-11-22 13:16:38'),(7,1,8,3,2,'2025-11-22 13:16:38'),(8,2,8,4,2,'2025-11-22 13:16:38'),(9,3,8,3,2,'2025-11-22 13:16:38'),(10,1,9,3,1,'2025-11-22 13:16:38'),(11,2,9,3,1,'2025-11-22 13:16:38'),(12,3,9,2,1,'2025-11-22 13:16:38'),(13,1,10,2,1,'2025-11-22 13:16:38'),(14,2,10,1,1,'2025-11-22 14:21:33'),(15,3,10,2,1,'2025-11-22 13:16:38'),(46,1,1,5,2,'2025-11-22 13:54:32'),(47,2,1,7,2,'2025-11-22 13:54:32'),(48,3,1,5,2,'2025-11-22 13:53:28'),(49,1,2,3,1,'2025-11-22 13:17:03'),(50,2,2,2,1,'2025-11-22 14:18:35'),(51,3,2,2,1,'2025-11-22 13:17:03'),(52,1,3,4,2,'2025-11-22 13:17:03'),(53,2,3,4,2,'2025-11-22 13:17:03'),(54,3,3,4,2,'2025-11-22 13:17:03'),(55,1,4,2,1,'2025-11-22 13:17:03'),(56,2,4,2,1,'2025-11-22 13:17:03'),(57,3,4,2,1,'2025-11-22 13:17:03'),(58,1,5,1,1,'2025-11-22 13:17:03'),(59,2,5,1,1,'2025-11-22 14:18:35'),(60,3,5,1,1,'2025-11-22 13:17:03');
/*!40000 ALTER TABLE `stock_sucursal` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `actualizar_stock_total_after_insert` AFTER INSERT ON `stock_sucursal` FOR EACH ROW BEGIN
    UPDATE productos
    SET stockTotal = (
        SELECT COALESCE(SUM(stockDisponible), 0)
        FROM stock_sucursal
        WHERE idProducto = NEW.idProducto
    )
    WHERE idProducto = NEW.idProducto;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `actualizar_stock_total_after_update` AFTER UPDATE ON `stock_sucursal` FOR EACH ROW BEGIN
    UPDATE productos
    SET stockTotal = (
        SELECT COALESCE(SUM(stockDisponible), 0)
        FROM stock_sucursal
        WHERE idProducto = NEW.idProducto
    )
    WHERE idProducto = NEW.idProducto;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `actualizar_stock_total_after_delete` AFTER DELETE ON `stock_sucursal` FOR EACH ROW BEGIN
    UPDATE productos
    SET stockTotal = (
        SELECT COALESCE(SUM(stockDisponible), 0)
        FROM stock_sucursal
        WHERE idProducto = OLD.idProducto
    )
    WHERE idProducto = OLD.idProducto;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `sucursales`
--

DROP TABLE IF EXISTS `sucursales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sucursales` (
  `idSucursal` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(500) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `horario` varchar(200) DEFAULT NULL,
  `activa` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`idSucursal`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sucursales`
--

LOCK TABLES `sucursales` WRITE;
/*!40000 ALTER TABLE `sucursales` DISABLE KEYS */;
INSERT INTO `sucursales` VALUES (1,'Sucursal Centro','Av. Rivadavia 1000, CABA','+54 11 4000-1000','centro@atiliomarola.com','Lun-Vie: 9:00-18:00, Sáb: 9:00-13:00',1),(2,'Sucursal Norte','Av. Cabildo 2000, CABA','+54 11 4000-2000','norte@atiliomarola.com','Lun-Vie: 8:30-19:00, Sáb: 9:00-14:00',1),(3,'Sucursal Sur','Av. Avellaneda 3000, Avellaneda','+54 11 4000-3000','sur@atiliomarola.com','Lun-Vie: 9:00-17:30',1);
/*!40000 ALTER TABLE `sucursales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_favorites`
--

DROP TABLE IF EXISTS `user_favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `idProducto` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idUsuario` (`idUsuario`),
  KEY `idProducto` (`idProducto`),
  CONSTRAINT `user_favorites_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`idUsuario`) ON DELETE CASCADE,
  CONSTRAINT `user_favorites_ibfk_2` FOREIGN KEY (`idProducto`) REFERENCES `productos` (`idProducto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_favorites`
--

LOCK TABLES `user_favorites` WRITE;
/*!40000 ALTER TABLE `user_favorites` DISABLE KEYS */;
INSERT INTO `user_favorites` VALUES (1,6,10,'2025-11-22 14:06:50'),(2,6,7,'2025-11-22 14:06:54'),(3,6,5,'2025-11-22 14:07:12');
/*!40000 ALTER TABLE `user_favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `idUsuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `idRol` int NOT NULL,
  `tokenVersion` int DEFAULT '0',
  `fechaRegistro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_usuarios_email` (`email`),
  KEY `idx_usuarios_rol` (`idRol`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`idRol`) REFERENCES `roles` (`idRol`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Admin','Sistema','admin@atiliomarola.com','$2a$10$N9qo8uLOickgx2ZMRZoMye1IYZIP/CqVvOUMLEL6jE0ZQZZ6zLzze',3,0,'2025-11-22 13:10:54',1),(2,'Juan','Pérez','juan.perez@email.com','$2a$10$N9qo8uLOickgx2ZMRZoMye1IYZIP/CqVvOUMLEL6jE0ZQZZ6zLzze',1,0,'2025-11-22 13:10:54',1),(3,'María','González','maria.gonzalez@email.com','$2a$10$N9qo8uLOickgx2ZMRZoMye1IYZIP/CqVvOUMLEL6jE0ZQZZ6zLzze',1,0,'2025-11-22 13:10:54',1),(4,'Carlos','Vendedor','carlos.vendedor@email.com','$2a$10$N9qo8uLOickgx2ZMRZoMye1IYZIP/CqVvOUMLEL6jE0ZQZZ6zLzze',2,0,'2025-11-22 13:10:54',1),(5,'Admin','Demo','admin@example.com','$2b$10$f/ArGE9iUarIXzWTi8jfKOMx6KfJSu1kzN9pAlU9dm9ip2oDm1bVK',3,0,'2025-11-22 13:11:57',1),(6,'Luciano','Llanos','lucianollanos90@gmail.com','$2b$10$Rlvo7xxM/tW/briaHqpuHeC1Paj421dPBIvCqGBGsoqAZ.qIKG1nq',1,0,'2025-11-22 14:06:43',1),(7,'Martin','Cirio','vendedor@gmail.com','$2b$10$ouwIgpAXfjmGCmGGPvknkuSk7baV/hh.f5BJUXhYWOxNN6bkdRoHu',2,0,'2025-11-22 14:16:44',1),(8,'Sofia','Diaz','guest_1763821104884_856@local.local','$2b$10$sbPe4wqLGnIPQqqDB.5HyOD0PQKJoIcpeS5kAvEllWPZP3DMXye5u',1,0,'2025-11-22 14:18:24',1),(9,'Franco','Gonzales','guest_1763821249662_926@local.local','$2b$10$aH1/3mlvjnke/PyMfnbfXefKOkhDz/skmyH3g2L0vWSXRMExBGLh2',1,0,'2025-11-22 14:20:49',1);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vista_productos_stock`
--

DROP TABLE IF EXISTS `vista_productos_stock`;
/*!50001 DROP VIEW IF EXISTS `vista_productos_stock`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_productos_stock` AS SELECT 
 1 AS `idProducto`,
 1 AS `nombre`,
 1 AS `descripcion`,
 1 AS `precio`,
 1 AS `categoria`,
 1 AS `stockTotal`,
 1 AS `imagenes`,
 1 AS `total_imagenes`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_servicios_completa`
--

DROP TABLE IF EXISTS `vista_servicios_completa`;
/*!50001 DROP VIEW IF EXISTS `vista_servicios_completa`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_servicios_completa` AS SELECT 
 1 AS `idSolicitud`,
 1 AS `idUsuario`,
 1 AS `tipoServicio`,
 1 AS `descripcion`,
 1 AS `direccion`,
 1 AS `telefono`,
 1 AS `fechaPreferida`,
 1 AS `horaPreferida`,
 1 AS `estado`,
 1 AS `observacionesAdmin`,
 1 AS `fechaCreacion`,
 1 AS `fechaActualizacion`,
 1 AS `nombre`,
 1 AS `apellido`,
 1 AS `email`,
 1 AS `tipoServicioDescripcion`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'atilio_marola'
--

--
-- Dumping routines for database 'atilio_marola'
--
/*!50003 DROP PROCEDURE IF EXISTS `CrearPedido` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `CrearPedido`(
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `RecalculateAllStock` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `RecalculateAllStock`()
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `pedidos_view`
--

/*!50001 DROP VIEW IF EXISTS `pedidos_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `pedidos_view` AS select `p`.`idPedido` AS `idPedido`,`p`.`idCliente` AS `idCliente`,`p`.`idSucursal` AS `idSucursal`,`p`.`idSucursalOrigen` AS `idSucursalOrigen`,`p`.`total` AS `total`,`p`.`estado` AS `estado`,`p`.`metodoPago` AS `metodoPago`,`p`.`direccionEnvio` AS `direccionEnvio`,`p`.`observaciones` AS `observaciones`,`p`.`cuotas` AS `cuotas`,`p`.`interes` AS `interes`,`p`.`descuento` AS `descuento`,`p`.`totalConInteres` AS `totalConInteres`,`p`.`fechaPedido` AS `fechaPedido`,`p`.`fechaActualizacion` AS `fechaActualizacion`,`p`.`fechaPedido` AS `fecha` from `pedidos` `p` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_productos_stock`
--

/*!50001 DROP VIEW IF EXISTS `vista_productos_stock`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_productos_stock` AS select `p`.`idProducto` AS `idProducto`,`p`.`nombre` AS `nombre`,`p`.`descripcion` AS `descripcion`,`p`.`precio` AS `precio`,coalesce(`c`.`nombre`,'') AS `categoria`,`p`.`stockTotal` AS `stockTotal`,group_concat(`pi`.`imagen` order by `pi`.`orden` ASC separator ',') AS `imagenes`,count(`pi`.`id`) AS `total_imagenes` from ((`productos` `p` left join `categorias` `c` on((`p`.`idCategoria` = `c`.`idCategoria`))) left join `producto_imagenes` `pi` on((`p`.`idProducto` = `pi`.`producto_id`))) where (`p`.`activo` = true) group by `p`.`idProducto` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_servicios_completa`
--

/*!50001 DROP VIEW IF EXISTS `vista_servicios_completa`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_servicios_completa` AS select `s`.`idSolicitud` AS `idSolicitud`,`s`.`idUsuario` AS `idUsuario`,`s`.`tipoServicio` AS `tipoServicio`,`s`.`descripcion` AS `descripcion`,`s`.`direccion` AS `direccion`,`s`.`telefono` AS `telefono`,`s`.`fechaPreferida` AS `fechaPreferida`,`s`.`horaPreferida` AS `horaPreferida`,`s`.`estado` AS `estado`,`s`.`observacionesAdmin` AS `observacionesAdmin`,`s`.`fechaCreacion` AS `fechaCreacion`,`s`.`fechaActualizacion` AS `fechaActualizacion`,`u`.`nombre` AS `nombre`,`u`.`apellido` AS `apellido`,`u`.`email` AS `email`,(case when (`s`.`tipoServicio` = 'instalacion') then 'Instalación de producto' when (`s`.`tipoServicio` = 'mantenimiento') then 'Mantenimiento' when (`s`.`tipoServicio` = 'garantia') then 'Arreglo por garantía' end) AS `tipoServicioDescripcion` from (`solicitudes_servicio_postventa` `s` join `usuarios` `u` on((`s`.`idUsuario` = `u`.`idUsuario`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 21:57:38
