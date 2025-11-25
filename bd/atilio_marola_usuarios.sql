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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 21:53:56
