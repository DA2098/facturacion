-- ═══════════════════════════════════════════════════════════════
-- 04_METODOS_PAGO.SQL — MIGRACIÓN DE CATÁLOGO DE PAGOS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS metodos_pago (
    id               UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre           VARCHAR(50)     NOT NULL UNIQUE,
    activo           BOOLEAN         NOT NULL DEFAULT TRUE,
    orden            SMALLINT        NOT NULL DEFAULT 0,
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE metodos_pago IS 'Catálogo de métodos de pago disponibles';
COMMENT ON COLUMN metodos_pago.nombre IS 'Nombre visible del método de pago';
COMMENT ON COLUMN metodos_pago.activo IS 'Indica si el método puede usarse en ventas';

INSERT INTO metodos_pago (nombre, orden) VALUES
('Efectivo', 1),
('Tarjeta', 2),
('Transferencia', 3),
('Crédito', 4)
ON CONFLICT (nombre) DO UPDATE
SET activo = EXCLUDED.activo,
    orden = EXCLUDED.orden,
    updated_at = CURRENT_TIMESTAMP;
