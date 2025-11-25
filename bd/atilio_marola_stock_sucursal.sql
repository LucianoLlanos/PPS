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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 21:53:57
