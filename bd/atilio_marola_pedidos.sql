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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 21:53:53
