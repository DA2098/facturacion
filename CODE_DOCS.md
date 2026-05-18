# Documentación línea a línea — FacturaYa

Este documento explica, de forma detallada y puntual, el código de los módulos centrales de la API backend y del cliente HTTP del frontend. Está pensado para lectura humana y revisión, sin alterar el código fuente.

---

## server/src/db.ts

1. import { Pool } from 'pg';
   - Importa la clase `Pool` de la librería `pg` (driver PostgreSQL para Node).

2. import dotenv from 'dotenv';
   - Importa `dotenv` para cargar variables de entorno desde `.env`.

3. dotenv.config();
   - Ejecuta la carga de variables de entorno inmediatamente.

4. const pool = new Pool({
   - Crea un nuevo pool de conexiones. Las opciones siguientes describen cada campo.

5.   host: process.env.DB_HOST || 'localhost',
   - Host de la DB; usa `DB_HOST` o `localhost` por defecto.

6.   port: parseInt(process.env.DB_PORT || '5432'),
   - Puerto de la DB; parsea `DB_PORT` o usa `5432`.

7.   database: process.env.DB_NAME || 'facturaya',
   - Nombre de la base de datos; `DB_NAME` o `facturaya`.

8.   user: process.env.DB_USER || 'postgres',
   - Usuario DB; `DB_USER` o `postgres`.

9.   password: process.env.DB_PASSWORD || 'password',
   - Contraseña DB; `DB_PASSWORD` o `password` por defecto (cambiar en producción).

10. });
    - Cierre del objeto de configuración del pool.

11. pool.on('connect', () => console.log('✅ PostgreSQL conectado'));
    - Evento que imprime un log cuando se establece la conexión.

12. pool.on('error', (err) => console.error('❌ PostgreSQL error:', err));
    - Evento que captura errores globales del pool.

13. export default pool;
    - Exporta el pool para que las rutas lo reutilicen.

---

## server/src/routes/auth.ts

(Explicación por bloques y por línea relevante)

1. import { Router } from 'express';
   - Importa `Router` para crear un conjunto de rutas independientes.

2. import pool from '../db';
   - Importa el `pool` de conexiones para consultar la DB.

3. import bcrypt from 'bcryptjs';
   - Biblioteca para hashear/validar contraseñas.

4. import jwt from 'jsonwebtoken';
   - Biblioteca para firmar tokens JWT.

5. const router = Router();
   - Crea el router de Express para los endpoints `/api/auth`.

6. const SECRET = process.env.JWT_SECRET || 'facturaya_secret';
   - Secreto para firmar tokens; usar variable de entorno en producción.

### POST /login

7. router.post('/login', async (req, res) => { ... });
   - Endpoint que recibe `{ email, password }` en `req.body`.

8. const { email, password } = req.body;
   - Extrae credenciales del body.

9. if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
   - Validación básica.

10. const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND activo = TRUE', [email]);
    - Busca usuario activo por email; evita usuarios inactivos.

11. if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
    - Responde 401 si no existe usuario.

12. const user = result.rows[0];
    - Usuario encontrado.

13. const valid = await bcrypt.compare(password, user.password);
    - Compara la contraseña en texto con el hash guardado.

14. if (!valid && user.password !== password) return res.status(401).json({ error: 'Credenciales inválidas' });
    - Fallback para desarrollo: si la DB contiene un password no hasheado.

15. const token = jwt.sign({ id: user.id, rol: user.rol }, SECRET, { expiresIn: '24h' });
    - Genera un JWT con `id` y `rol`. Expira a las 24h.

16. await pool.query('INSERT INTO sesiones (usuario_id, token) VALUES ($1, $2)', [user.id, token]);
    - Registra la sesión en la tabla `sesiones` (auditoría/gestión de sesiones).

17. const { password: _, ...userData } = user;
    - Elimina `password` del objeto antes de devolverlo.

18. res.json({ usuario: userData, token });
    - Devuelve usuario y token.

19. catch { ... res.status(500) }
    - Manejo genérico de errores.

### POST /registro

20. router.post('/registro', async (req, res) => { ... });
    - Endpoint para crear usuarios.

21. Validaciones: comprobar `nombre`, `email`, `password`.

22. const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    - Verifica unicidad del email.

23. const hash = await bcrypt.hash(password, 10);
    - Hashea la contraseña con coste 10.

24. INSERT INTO usuarios (...) RETURNING *
    - Inserta el usuario en la tabla y retorna la fila creada.

25. const token = jwt.sign(...)
    - Genera JWT para la sesión de registro.

26. res.status(201).json({ usuario: userData, token });
    - Devuelve 201 Created con usuario y token.

---

## server/src/routes/usuarios.ts

1. router.get('/')
   - Lista todos los usuarios (sin passwords) para administración.

2. router.get('/:id')
   - Obtiene un usuario por id; responde 404 si no existe.

3. router.put('/:id')
   - Actualiza un usuario. Si se proporciona `password`, lo hashea antes de persistir.
   - Uso de `COALESCE($1, campo)` permite actualizaciones parciales.

4. router.delete('/:id')
   - Elimina un usuario; captura error con código `23503` (FK) y responde 409 si hay facturas relacionadas.

---

## server/src/routes/productos.ts

1. router.get('/')
   - Devuelve la lista de productos ordenada.

2. router.get('/:id')
   - Objeto producto por id.

3. router.post('/')
   - Crea producto; valida `codigo` y `nombre`; maneja conflicto `23505` (código duplicado).

4. router.put('/:id')
   - Actualiza producto con COALESCE para parcial.

5. router.delete('/:id')
   - Elimina producto; si está referenciado en facturas responde 409.

---

## server/src/routes/facturas.ts

1. router.get('/')
   - Lista facturas usando la vista `v_facturas_completas`.
   - Permite filtros por `estado`, `cliente_id`, `vendedor_id`.
   - Construye la consulta de forma parametrizada para evitar inyección SQL.

2. router.get('/:id')
   - Devuelve encabezado y detalles: consulta la vista y luego los `factura_detalles` con JOIN a productos para nombres/códigos.

3. router.post('/')
   - Crea factura y detalles en una transacción (`BEGIN`/`COMMIT`), con `ROLLBACK` en caso de error.
   - Calcula `subtotal` e `impuesto` localmente antes de insertar.
   - Usa la función `fn_next_factura_numero()` de la DB para numeración.
   - Inserta en `facturas` y luego en `factura_detalles`.

4. router.put('/:id')
   - Actualiza `estado` y `notas` de la factura.

5. router.delete('/:id')
   - Elimina factura por id.

---

## server/src/routes/dashboard.ts

1. router.get('/stats')
   - Consulta varias fuentes (usuarios, productos, vista resumen) y devuelve métricas agregadas para el dashboard.
   - Convierte strings de PostgreSQL a `number`/`float` antes de devolver.

---

## src/services/db.ts (cliente HTTP del frontend)

El archivo contiene un conjunto de funciones que consumen la API backend. A continuación se explica cada bloque/función:

1. const API = import.meta.env?.VITE_API_URL || 'http://localhost:3001';
   - Base URL para llamadas al backend. En producción, configurar `VITE_API_URL`.

2. function clearLegacyMockData() { ... }
   - Limpia claves antiguas de `localStorage` usadas en la versión demo.

3. async function request<T>(path, init) { ... }
   - Helper centralizado que:
     - Hace `fetch(API + path)` con `Content-Type: application/json`.
     - Lanza Error con el mensaje de respuesta si `res.ok` es false.
     - Retorna `undefined` si status 204 o `res.json()`.

4. mapFactura/mapProducto/mapUsuario
   - Normalizan las filas devueltas por el backend a las interfaces `Factura`, `Producto`, `Usuario` usadas en el frontend.
   - Garantizan tipos y valores por defecto para campos opcionales.

5. Funciones exportadas (login, registrar, getUsuarios, getProductos, getFacturas, createFactura, etc.)
   - Cada función corresponde a un endpoint REST.
   - `login` y `registrar` llaman a `/api/auth/*` y retornan usuario o token.
   - `getFacturas` arma query string con filtros y mapea la respuesta.
   - `createFactura` envía el payload con `detalles` y mapea la factura creada.
   - Todas las funciones capturan errores y devuelven valores claros (`null`, `undefined`, `false`) en caso de fallo para que la UI pueda manejar el flujo.

---

Si quieres, puedo:
- Generar un archivo por cada fichero con el código original y comentario línea por línea justo al lado (más verboso).
- Incluir ejemplos de request/response (curl/Thunder Client) concretos para endpoints críticos.

Dime qué formato prefieres para continuar (más verboso inline, o ejemplos de uso).