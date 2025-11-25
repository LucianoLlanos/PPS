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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 21:53:56
