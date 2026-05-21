-- 06_ADD_AUTOPAGO_FACTURAS.SQL
-- Agrega soporte de auto-pago/cuenta regresiva para facturas de tienda

ALTER TABLE facturas
ADD COLUMN IF NOT EXISTS canal_venta VARCHAR(20) NOT NULL DEFAULT 'venta';

ALTER TABLE facturas
ADD COLUMN IF NOT EXISTS pago_programado_para TIMESTAMP NULL;

ALTER TABLE facturas
ADD COLUMN IF NOT EXISTS pago_autorizado_at TIMESTAMP NULL;

CREATE TABLE IF NOT EXISTS config_autopago (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    minutos INTEGER NOT NULL DEFAULT 10 CHECK (minutos >= 0),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO config_autopago (id, activo, minutos)
VALUES (1, TRUE, 10)
ON CONFLICT (id) DO NOTHING;
