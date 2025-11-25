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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 21:53:54
