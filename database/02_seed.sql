-- ═══════════════════════════════════════════════════════════════
-- 02_SEED.SQL — DATOS DE PRUEBA
-- ═══════════════════════════════════════════════════════════════
-- Ejecutar DESPUÉS de 01_schema.sql
-- Contraseñas almacenadas con crypt() + gen_salt() de pgcrypto
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- USUARIOS
-- ═══════════════════════════════════════════════════════════════
-- Contraseñas en texto plano para pruebas (en producción usar hash):
--   admin@facturaya.com   / admin123
--   maria@facturaya.com   / maria123
--   jorge@facturaya.com   / jorge123
--   ana@empresa.com       / ana123
--   luis@techsol.com      / luis123
--   rosa@comercial.com    / rosa123
-- ═══════════════════════════════════════════════════════════════

INSERT INTO usuarios (id, nombre, email, password, rol, empresa, ruc, telefono, direccion) VALUES
-- ── ADMINISTRADOR ──
('10000000-0000-0000-0000-000000000001',
 'Carlos Admin',
 'admin@facturaya.com',
 crypt('admin123', gen_salt('bf')),
 'admin',
 'FacturaYa S.A.',
 '20100001001',
 '999-111-001',
 'Av. Central 100, Lima'),

-- ── VENDEDORA ──
('10000000-0000-0000-0000-000000000002',
 'María Vendedora',
 'maria@facturaya.com',
 crypt('maria123', gen_salt('bf')),
 'vendedor',
 'FacturaYa S.A.',
 '20100001001',
 '999-111-002',
 'Av. Central 100, Lima'),

-- ── CONTADOR ──
('10000000-0000-0000-0000-000000000003',
 'Jorge Contador',
 'jorge@facturaya.com',
 crypt('jorge123', gen_salt('bf')),
 'contador',
 'FacturaYa S.A.',
 '20100001001',
 '999-111-003',
 'Av. Central 100, Lima'),

-- ── CLIENTES ──
('10000000-0000-0000-0000-000000000004',
 'Ana Torres',
 'ana@empresa.com',
 crypt('ana123', gen_salt('bf')),
 'cliente',
 'Distribuidora Torres',
 '20512345678',
 '555-0101',
 'Jr. Comercio 456, Arequipa'),

('10000000-0000-0000-0000-000000000005',
 'Luis Mendoza',
 'luis@techsol.com',
 crypt('luis123', gen_salt('bf')),
 'cliente',
 'Tech Solutions EIRL',
 '20601234567',
 '555-0202',
 'Calle Digital 789, Trujillo'),

('10000000-0000-0000-0000-000000000006',
 'Rosa Gutiérrez',
 'rosa@comercial.com',
 crypt('rosa123', gen_salt('bf')),
 'cliente',
 'Comercial Gutiérrez SAC',
 '20709876543',
 '555-0303',
 'Av. Los Olivos 321, Chiclayo');

-- ═══════════════════════════════════════════════════════════════
-- PRODUCTOS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO productos (id, codigo, nombre, descripcion, image_url, precio, impuesto, stock, categoria) VALUES
('20000000-0000-0000-0000-000000000001', 'LAP-001', 'Laptop HP 15"',        'HP 15, 8GB RAM, 256GB SSD',               'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80', 2500.00, 18, 25,  'Computadoras'),
('20000000-0000-0000-0000-000000000002', 'MON-001', 'Monitor Samsung 24"',   'Full HD IPS 24 pulgadas',                  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80', 850.00, 18, 40,  'Monitores'),
('20000000-0000-0000-0000-000000000003', 'MOU-001', 'Mouse Logitech M280',   'Mouse inalámbrico ergonómico',              'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80', 45.00, 18, 150, 'Periféricos'),
('20000000-0000-0000-0000-000000000004', 'TEC-001', 'Teclado Mecánico RGB',  'Switches Blue, retroiluminado',            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80', 120.00, 18, 80,  'Periféricos'),
('20000000-0000-0000-0000-000000000005', 'IMP-001', 'Impresora Epson L3250', 'Multifuncional tinta continua',            'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=900&q=80', 680.00, 18, 15,  'Impresoras'),
('20000000-0000-0000-0000-000000000006', 'SSD-001', 'Disco SSD 512GB',       'Kingston A400 SATA III',                   'https://images.unsplash.com/photo-1590608897129-79da98d15963?auto=format&fit=crop&w=900&q=80', 195.00, 18, 60,  'Almacenamiento'),
('20000000-0000-0000-0000-000000000007', 'CAB-001', 'Cable HDMI 2m',         'HDMI 2.0 Alta velocidad',                   'https://images.unsplash.com/photo-1555617981-dac3880eac6c?auto=format&fit=crop&w=900&q=80', 15.00, 18, 200, 'Cables'),
('20000000-0000-0000-0000-000000000008', 'SRV-001', 'Soporte Técnico (hora)','Servicio de soporte remoto',                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80', 80.00, 18, 999, 'Servicios'),
('20000000-0000-0000-0000-000000000009', 'LAP-002', 'Laptop Lenovo 14"',     'Lenovo IdeaPad, 16GB RAM, 512GB SSD',     'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80', 3200.00, 18, 12,  'Computadoras'),
('20000000-0000-0000-0000-000000000010', 'AUD-001', 'Audífonos Sony WH-1000','Audífonos inalámbricos con cancelación',    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', 950.00, 18, 30,  'Audio');

-- ═══════════════════════════════════════════════════════════════
-- MÉTODOS DE PAGO
-- ═══════════════════════════════════════════════════════════════

INSERT INTO metodos_pago (id, nombre, orden) VALUES
('40000000-0000-0000-0000-000000000001', 'Efectivo', 1),
('40000000-0000-0000-0000-000000000002', 'Tarjeta', 2),
('40000000-0000-0000-0000-000000000003', 'Transferencia', 3),
('40000000-0000-0000-0000-000000000004', 'Crédito', 4);

-- ═══════════════════════════════════════════════════════════════
-- FACTURAS DE EJEMPLO
-- ═══════════════════════════════════════════════════════════════

-- Factura 1: Emitida — Ana Torres compró laptop + mouse
INSERT INTO facturas (id, numero, cliente_id, vendedor_id, fecha, subtotal, impuesto_total, total, estado, metodo_pago, notas) VALUES
('30000000-0000-0000-0000-000000000001',
 'FAC-000001',
 '10000000-0000-0000-0000-000000000004',  -- Ana Torres
 '10000000-0000-0000-0000-000000000002',  -- María Vendedora
 '2025-01-15', 2545.00, 458.10, 3003.10, 'emitida', 'Tarjeta',
 'Venta de equipo de cómputo');

INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio_unitario, impuesto, subtotal) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1, 2500.00, 18, 2500.00),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 1,   45.00, 18,   45.00);

-- Factura 2: Pagada — Luis Mendoza compró monitor + teclado
INSERT INTO facturas (id, numero, cliente_id, vendedor_id, fecha, subtotal, impuesto_total, total, estado, metodo_pago, notas) VALUES
('30000000-0000-0000-0000-000000000002',
 'FAC-000002',
 '10000000-0000-0000-0000-000000000005',  -- Luis Mendoza
 '10000000-0000-0000-0000-000000000002',  -- María Vendedora
 '2025-01-18', 970.00, 174.60, 1144.60, 'pagada', 'Transferencia',
 'Pago confirmado por transferencia');

INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio_unitario, impuesto, subtotal) VALUES
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 1, 850.00, 18, 850.00),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 1, 120.00, 18, 120.00);

-- Factura 3: Anulada — Rosa Gutiérrez pidió 2 horas de soporte
INSERT INTO facturas (id, numero, cliente_id, vendedor_id, fecha, subtotal, impuesto_total, total, estado, metodo_pago, notas) VALUES
('30000000-0000-0000-0000-000000000003',
 'FAC-000003',
 '10000000-0000-0000-0000-000000000006',  -- Rosa Gutiérrez
 '10000000-0000-0000-0000-000000000001',  -- Carlos Admin
 '2025-01-20', 160.00, 28.80, 188.80, 'anulada', 'Efectivo',
 'Cliente canceló el servicio');

INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio_unitario, impuesto, subtotal) VALUES
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000008', 2, 80.00, 18, 160.00);

-- Factura 4: Emitida — Ana Torres compró impresora
INSERT INTO facturas (id, numero, cliente_id, vendedor_id, fecha, subtotal, impuesto_total, total, estado, metodo_pago, notas) VALUES
('30000000-0000-0000-0000-000000000004',
 'FAC-000004',
 '10000000-0000-0000-0000-000000000004',  -- Ana Torres
 '10000000-0000-0000-0000-000000000001',  -- Carlos Admin
 '2025-01-25', 680.00, 122.40, 802.40, 'emitida', 'Crédito',
 'Compra a crédito 30 días');

INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio_unitario, impuesto, subtotal) VALUES
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005', 1, 680.00, 18, 680.00);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════

-- Verificar datos insertados:
-- SELECT id, nombre, email, rol FROM usuarios;
-- SELECT id, codigo, nombre, precio, stock FROM productos;
-- SELECT * FROM v_facturas_completas;
-- SELECT * FROM v_resumen_facturacion;
-- SELECT * FROM v_ventas_por_vendedor;

-- Verificar login (ejemplo):
-- SELECT id, nombre, rol FROM usuarios
-- WHERE email = 'admin@facturaya.com'
-- AND password = crypt('admin123', password);

-- ═══════════════════════════════════════════════════════════════
-- FIN DEL SEED
-- ═══════════════════════════════════════════════════════════════
