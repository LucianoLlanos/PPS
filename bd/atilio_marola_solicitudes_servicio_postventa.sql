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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 21:53:54
