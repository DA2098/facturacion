-- ═══════════════════════════════════════════════════════════════
-- 03_ADD_PRODUCTO_IMAGE_URL.SQL
-- Migración para bases ya creadas antes de agregar la imagen URL
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN productos.image_url IS 'URL de la imagen del producto para mostrar en admin y tienda';
