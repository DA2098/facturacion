-- ═══════════════════════════════════════════════════════════════
-- 01_SCHEMA.SQL — ESTRUCTURA COMPLETA DE LA BASE DE DATOS
-- ═══════════════════════════════════════════════════════════════
-- Sistema: FACTS - Facturación Electrónica
-- Motor:   PostgreSQL 14+
-- Tool:    DBeaver / pgAdmin
--
-- PASO 1: Crear la base de datos (ejecutar como superuser):
--   CREATE DATABASE facts;
-- PASO 2: Conectarse a facturaya en DBeaver
-- PASO 3: Ejecutar este script completo
-- PASO 4: Ejecutar 02_seed.sql para datos de prueba
-- ═══════════════════════════════════════════════════════════════

-- Extensión para generar UUIDs automáticos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Extensión para encriptar contraseñas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════
-- LIMPIEZA: eliminar tablas si existen (orden por dependencias)
-- ═══════════════════════════════════════════════════════════════

DROP VIEW  IF EXISTS v_facturas_completas CASCADE;
DROP VIEW  IF EXISTS v_resumen_facturacion CASCADE;
DROP VIEW  IF EXISTS v_ventas_por_vendedor CASCADE;
DROP TABLE IF EXISTS factura_detalles CASCADE;
DROP TABLE IF EXISTS facturas CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS sesiones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- TIPOS ENUM
-- ═══════════════════════════════════════════════════════════════

DROP TYPE IF EXISTS rol_tipo CASCADE;
CREATE TYPE rol_tipo AS ENUM ('admin', 'vendedor', 'contador', 'cliente');

DROP TYPE IF EXISTS factura_estado CASCADE;
CREATE TYPE factura_estado AS ENUM ('pendiente', 'emitida', 'pagada', 'anulada');

-- ═══════════════════════════════════════════════════════════════
-- TABLA: usuarios
-- ═══════════════════════════════════════════════════════════════
-- Almacena todos los usuarios del sistema.
-- Los roles determinan qué ve cada usuario:
--   admin    → Acceso total (CRUD usuarios, productos, facturas, reportes)
--   vendedor → Productos (solo ver), crear ventas, sus facturas
--   contador → Facturas (solo ver), reportes financieros
--   cliente  → Tienda para comprar, ver sus propias facturas
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE usuarios (
    id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre      VARCHAR(200)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    rol         rol_tipo      NOT NULL DEFAULT 'cliente',
    empresa     VARCHAR(200)  DEFAULT '',
    ruc         VARCHAR(20)   DEFAULT '',
    telefono    VARCHAR(30)   DEFAULT '',
    direccion   VARCHAR(300)  DEFAULT '',
    activo      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_email    ON usuarios (email);
CREATE INDEX idx_usuarios_rol      ON usuarios (rol);
CREATE INDEX idx_usuarios_ruc      ON usuarios (ruc);
CREATE INDEX idx_usuarios_activo   ON usuarios (activo);

COMMENT ON TABLE  usuarios IS 'Usuarios del sistema con roles (admin/vendedor/contador/cliente)';
COMMENT ON COLUMN usuarios.rol IS 'Rol que define permisos: admin, vendedor, contador, cliente';
COMMENT ON COLUMN usuarios.ruc IS 'Registro Único de Contribuyente / NIT / Cédula fiscal';

-- ═══════════════════════════════════════════════════════════════
-- TABLA: sesiones
-- ═══════════════════════════════════════════════════════════════
-- Control de sesiones activas (tokens JWT o similares).
-- Permite invalidar sesiones y auditoría de acceso.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE sesiones (
    id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id  UUID          NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token       VARCHAR(500)  NOT NULL,
    ip          VARCHAR(50)   DEFAULT '',
    user_agent  TEXT          DEFAULT '',
    activa      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at  TIMESTAMP     NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

CREATE INDEX idx_sesiones_usuario ON sesiones (usuario_id);
CREATE INDEX idx_sesiones_token   ON sesiones (token);

COMMENT ON TABLE sesiones IS 'Sesiones activas de usuario para control de acceso';

-- ═══════════════════════════════════════════════════════════════
-- TABLA: productos
-- ═══════════════════════════════════════════════════════════════
-- Catálogo de productos y servicios para facturar.
-- Incluye control de stock y categorización.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE productos (
    id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo           VARCHAR(30)    NOT NULL UNIQUE,
    nombre           VARCHAR(200)   NOT NULL,
    descripcion      TEXT           DEFAULT '',
    image_url        TEXT           DEFAULT '',
    precio           DECIMAL(12,2)  NOT NULL DEFAULT 0.00 CHECK (precio >= 0),
    impuesto         DECIMAL(5,2)   NOT NULL DEFAULT 18.00 CHECK (impuesto >= 0),
    stock            INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
    categoria        VARCHAR(100)   DEFAULT '',
    activo           BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_productos_codigo    ON productos (codigo);
CREATE INDEX idx_productos_nombre    ON productos (nombre);
CREATE INDEX idx_productos_categoria ON productos (categoria);
CREATE INDEX idx_productos_activo    ON productos (activo);

COMMENT ON TABLE  productos IS 'Catálogo de productos y servicios facturables';
COMMENT ON COLUMN productos.image_url IS 'URL de la imagen del producto para mostrar en admin y tienda';
COMMENT ON COLUMN productos.impuesto IS 'Porcentaje de impuesto (IGV/IVA) aplicable';
COMMENT ON COLUMN productos.stock IS 'Cantidad disponible en inventario';

-- ═══════════════════════════════════════════════════════════════
-- TABLA: metodos_pago
-- ═══════════════════════════════════════════════════════════════
-- Catálogo de métodos de pago disponibles en el sistema.
-- Se usa para poblar selectores en ventas y tienda.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE metodos_pago (
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

-- ═══════════════════════════════════════════════════════════════
-- TABLA: facturas
-- ═══════════════════════════════════════════════════════════════
-- Encabezado de cada factura electrónica.
-- Referencia al cliente (comprador) y al vendedor (quien vende).
-- Contiene totales calculados y estado del pago.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE facturas (
    id               UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero           VARCHAR(20)     NOT NULL UNIQUE,
    cliente_id       UUID            NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    vendedor_id      UUID            NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha            DATE            NOT NULL DEFAULT CURRENT_DATE,
    subtotal         DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    impuesto_total   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total            DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    estado           factura_estado  NOT NULL DEFAULT 'emitida',
    metodo_pago      VARCHAR(50)     DEFAULT 'Efectivo',
    notas            TEXT            DEFAULT '',
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facturas_numero   ON facturas (numero);
CREATE INDEX idx_facturas_cliente  ON facturas (cliente_id);
CREATE INDEX idx_facturas_vendedor ON facturas (vendedor_id);
CREATE INDEX idx_facturas_estado   ON facturas (estado);
CREATE INDEX idx_facturas_fecha    ON facturas (fecha);

COMMENT ON TABLE  facturas IS 'Facturas electrónicas emitidas';
COMMENT ON COLUMN facturas.estado IS 'Estado: pendiente → emitida → pagada | anulada';
COMMENT ON COLUMN facturas.metodo_pago IS 'Método de pago: Efectivo, Tarjeta, Transferencia, Crédito';

-- ═══════════════════════════════════════════════════════════════
-- TABLA: factura_detalles
-- ═══════════════════════════════════════════════════════════════
-- Líneas de detalle (productos) de cada factura.
-- Al eliminar una factura, sus detalles se eliminan en cascada.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE factura_detalles (
    id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_id       UUID           NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    producto_id      UUID           NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad         INTEGER        NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    impuesto         DECIMAL(5,2)   NOT NULL DEFAULT 18.00,
    subtotal         DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_detalles_factura  ON factura_detalles (factura_id);
CREATE INDEX idx_detalles_producto ON factura_detalles (producto_id);

COMMENT ON TABLE  factura_detalles IS 'Líneas de detalle de cada factura';
COMMENT ON COLUMN factura_detalles.subtotal IS 'cantidad × precio_unitario (antes de impuesto)';

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS: actualizar updated_at automáticamente
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_timestamp
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_productos_timestamp
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_facturas_timestamp
    BEFORE UPDATE ON facturas
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


CREATE OR REPLACE FUNCTION fn_descontar_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE productos
    SET stock = GREATEST(0, stock - NEW.cantidad)
    WHERE id = NEW.producto_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_descontar_stock
    AFTER INSERT ON factura_detalles
-- ═══════════════════════════════════════════════════════════════
-- TABLA: notificaciones
-- ═══════════════════════════════════════════════════════════════
-- Notificaciones individuales para usuarios (admin, cliente, vendedor, contador)
-- Tipos: producto_agregado, factura_emitida, factura_pagada, etc.

CREATE TABLE notificaciones (
     id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
     usuario_id      UUID           NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     tipo            VARCHAR(50)    NOT NULL, -- Ej: producto_agregado, factura_emitida, factura_pagada
     titulo          VARCHAR(200)   NOT NULL,
     mensaje         TEXT           NOT NULL,
     data            JSONB          DEFAULT '{}'::jsonb, -- Info adicional (opcional)
     leida           BOOLEAN        NOT NULL DEFAULT FALSE,
     eliminada       BOOLEAN        NOT NULL DEFAULT FALSE,
     created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones (usuario_id);
CREATE INDEX idx_notificaciones_tipo    ON notificaciones (tipo);
CREATE INDEX idx_notificaciones_leida   ON notificaciones (leida);

COMMENT ON TABLE  notificaciones IS 'Notificaciones individuales para usuarios, con tipos y soporte de lectura/borrado';
COMMENT ON COLUMN notificaciones.tipo IS 'Tipo de evento: producto_agregado, factura_emitida, factura_pagada, etc';
COMMENT ON COLUMN notificaciones.data IS 'Datos adicionales en formato JSON (opcional)';
COMMENT ON COLUMN notificaciones.leida IS 'TRUE si el usuario ya vio la notificación';
COMMENT ON COLUMN notificaciones.eliminada IS 'TRUE si el usuario eliminó la notificación (soft delete)';
    FOR EACH ROW EXECUTE FUNCTION fn_descontar_stock();

-- ═══════════════════════════════════════════════════════════════
-- FUNCIÓN: generar siguiente número de factura
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_next_factura_numero()
RETURNS VARCHAR AS $$
DECLARE
    ultimo INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 5) AS INTEGER)), 0)
    INTO ultimo
    FROM facturas;
    RETURN 'FAC-' || LPAD((ultimo + 1)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_next_factura_numero IS 'Genera el siguiente número secuencial de factura (FAC-000001, FAC-000002, etc.)';

-- ═══════════════════════════════════════════════════════════════
-- VISTAS
-- ═══════════════════════════════════════════════════════════════

-- Vista: facturas con datos completos de cliente y vendedor
CREATE OR REPLACE VIEW v_facturas_completas AS
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
    -- datos del cliente
    c.id          AS cliente_id,
    c.nombre      AS cliente_nombre,
    c.ruc         AS cliente_ruc,
    c.email       AS cliente_email,
    c.empresa     AS cliente_empresa,
    -- datos del vendedor
    v.id          AS vendedor_id,
    v.nombre      AS vendedor_nombre,
    v.email       AS vendedor_email
FROM facturas f
INNER JOIN usuarios c ON f.cliente_id = c.id
INNER JOIN usuarios v ON f.vendedor_id = v.id
ORDER BY f.created_at DESC;

-- Vista: resumen para dashboard
CREATE OR REPLACE VIEW v_resumen_facturacion AS
SELECT
    COUNT(*)                                      AS total_facturas,
    COALESCE(SUM(total), 0)                       AS monto_total,
    COALESCE(SUM(impuesto_total), 0)              AS impuesto_total,
    COUNT(*) FILTER (WHERE estado = 'emitida')    AS emitidas,
    COUNT(*) FILTER (WHERE estado = 'pagada')     AS pagadas,
    COUNT(*) FILTER (WHERE estado = 'anulada')    AS anuladas,
    COUNT(*) FILTER (WHERE estado = 'pendiente')  AS pendientes
FROM facturas;

-- Vista: ventas agrupadas por vendedor
CREATE OR REPLACE VIEW v_ventas_por_vendedor AS
SELECT
    v.id AS vendedor_id,
    v.nombre AS vendedor_nombre,
    COUNT(f.id) AS total_facturas,
    COALESCE(SUM(f.total), 0) AS monto_total
FROM usuarios v
LEFT JOIN facturas f ON f.vendedor_id = v.id
WHERE v.rol IN ('admin', 'vendedor')
GROUP BY v.id, v.nombre
ORDER BY monto_total DESC;

-- ═══════════════════════════════════════════════════════════════
-- FIN DEL SCHEMA
-- ═══════════════════════════════════════════════════════════════
-- Ejecutar ahora: 02_seed.sql para insertar datos de prueba
-- ═══════════════════════════════════════════════════════════════
