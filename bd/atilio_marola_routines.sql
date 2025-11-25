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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 21:53:57
