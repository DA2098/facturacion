-- 07_UPDATE_FACTURAS_COMPLETAS_VIEW.SQL
-- Script completo para actualizar columnas y vista de facturas sin depender de selecciones parciales en DBeaver

ALTER TABLE facturas
ADD COLUMN IF NOT EXISTS canal_venta VARCHAR(20) NOT NULL DEFAULT 'venta';

ALTER TABLE facturas
ADD COLUMN IF NOT EXISTS pago_programado_para TIMESTAMP NULL;

ALTER TABLE facturas
ADD COLUMN IF NOT EXISTS pago_autorizado_at TIMESTAMP NULL;

DROP VIEW IF EXISTS v_facturas_completas;

CREATE VIEW v_facturas_completas AS
SELECT
    f.id,
    f.numero,
    f.fecha,
    f.subtotal,
    f.impuesto_total,
    f.total,
    f.estado,
    f.metodo_pago,
    f.notas,
    f.created_at,
    f.canal_venta,
    f.pago_programado_para,
    f.pago_autorizado_at,
    c.id          AS cliente_id,
    c.nombre      AS cliente_nombre,
    c.ruc         AS cliente_ruc,
    c.email       AS cliente_email,
    c.empresa     AS cliente_empresa,
    v.id          AS vendedor_id,
    v.nombre      AS vendedor_nombre,
    v.email       AS vendedor_email
FROM facturas f
INNER JOIN usuarios c ON f.cliente_id = c.id
INNER JOIN usuarios v ON f.vendedor_id = v.id
ORDER BY f.created_at DESC;
