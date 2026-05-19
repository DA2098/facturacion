-- Verificaciones después de ejecutar schema y seeds
SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';
SELECT count(*) AS usuarios_count FROM usuarios;
SELECT id, email, nombre, rol FROM usuarios ORDER BY created_at LIMIT 5;
