-- 03_TRUNCATE.SQL — Eliminar todos los datos de ejemplo
-- Ejecutar para dejar las tablas principales vacías

-- Trunca las tablas en bloque (usa CASCADE para dependencias)
TRUNCATE TABLE factura_detalles, facturas, productos, sesiones, usuarios RESTART IDENTITY CASCADE;

-- Verificación simple
SELECT 'OK' AS status;
