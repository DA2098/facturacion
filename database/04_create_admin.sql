-- ═══════════════════════════════════════════════════════════════
-- 04_CREATE_ADMIN.SQL — Crear o actualizar usuario administrador
-- ═══════════════════════════════════════════════════════════════
-- Inserta un usuario administrador con email administrador@factsdollar.com
-- Contraseña en texto plano: administrador (se guarda con crypt + gen_salt)
-- Uso: node server/run_sql.js "<DATABASE_URL>" database/04_create_admin.sql

INSERT INTO usuarios (id, nombre, email, password, rol, empresa, ruc, telefono, direccion)
VALUES
('10000000-0000-0000-0000-000000000010',
 'Administrador FACTS',
 'administrador@factsdollar.com',
 crypt('administrador', gen_salt('bf')),
 'admin',
 'FACTS S.A.',
 '20100001001',
 '999-000-000',
 'Sede central')
ON CONFLICT (email) DO UPDATE
SET nombre = EXCLUDED.nombre,
    password = EXCLUDED.password,
    rol = EXCLUDED.rol,
    empresa = EXCLUDED.empresa,
    ruc = EXCLUDED.ruc,
    telefono = EXCLUDED.telefono,
    direccion = EXCLUDED.direccion,
    activo = TRUE,
    updated_at = CURRENT_TIMESTAMP;

-- FIN
