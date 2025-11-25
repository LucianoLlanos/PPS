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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 21:53:56
