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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 21:53:53
