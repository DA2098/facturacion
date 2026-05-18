# 📄 FacturaYa v2 — Sistema de Facturación Electrónica

> Sistema web completo con Login/Registro, 4 roles de usuario (Admin, Vendedor,
> Contador, Cliente), tienda online, punto de venta, y base de datos PostgreSQL
> lista para montar en DBeaver.

---

## 📑 Índice

1. [Descripción General](#1-descripción-general)
2. [Roles y Permisos](#2-roles-y-permisos)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura de Carpetas](#4-estructura-de-carpetas)
5. [Diagrama de Flujo](#5-diagrama-de-flujo)
6. [Base de Datos PostgreSQL](#6-base-de-datos-postgresql)
7. [API REST — Endpoints](#7-api-rest--endpoints)
8. [Instalación Paso a Paso](#8-instalación-paso-a-paso)
9. [Manual de Uso](#9-manual-de-uso)
10. [Documentación del Código](#10-documentación-del-código)

---

## 1. Descripción General

**FacturaYa** es un sistema de facturación electrónica con:

- ✅ **Login y Registro** con autenticación
- ✅ **4 roles**: Admin, Vendedor, Contador, Cliente
- ✅ **Panel Admin**: Dashboard, CRUD usuarios, CRUD productos, ventas, facturas, reportes
- ✅ **Panel Vendedor**: Dashboard, productos, punto de venta, sus facturas
- ✅ **Panel Contador**: Dashboard, facturas (solo lectura), reportes financieros
- ✅ **Panel Cliente**: Tienda para comprar, ver sus facturas
- ✅ **CRUD completo** en todas las entidades
- ✅ **Base de datos PostgreSQL** con 5 tablas, triggers, vistas, funciones
- ✅ **Backend Express** con JWT, bcrypt, transacciones
- ✅ **Frontend React** funcional conectado al backend real por HTTP
- ✅ **Sincronización en tiempo real** con SSE para refrescar dashboards, tablas y ventas al instante

---

## 2. Roles y Permisos

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATRIZ DE PERMISOS                           │
├──────────────┬───────────┬───────────┬──────────┬──────────────┤
│ Funcionalidad│  Admin    │ Vendedor  │ Contador │   Cliente    │
├──────────────┼───────────┼───────────┼──────────┼──────────────┤
│ Dashboard    │    ✅     │    ✅     │    ✅    │      ❌      │
│ Usuarios     │  CRUD ✅  │    ❌     │    ❌    │      ❌      │
│ Productos    │  CRUD ✅  │  Ver ✅   │    ❌    │   Tienda ✅  │
│ Punto Venta  │    ✅     │    ✅     │    ❌    │      ❌      │
│ Facturas     │  Todo ✅  │ Las suyas │ Ver ✅   │  Las suyas   │
│ Reportes     │    ✅     │    ❌     │    ✅    │      ❌      │
│ Tienda       │    ❌     │    ❌     │    ❌    │      ✅      │
│ Mis Facturas │    ❌     │    ❌     │    ❌    │      ✅      │
└──────────────┴───────────┴───────────┴──────────┴──────────────┘
```

### Cuentas de prueba:

| Rol       | Email                   | Contraseña |
|-----------|-------------------------|------------|
| Admin     | admin@facturaya.com     | admin123   |
| Vendedor  | maria@facturaya.com     | maria123   |
| Contador  | jorge@facturaya.com     | jorge123   |
| Cliente   | ana@empresa.com         | ana123     |
| Cliente   | luis@techsol.com        | luis123    |

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR                              │
│            Login / Registro / Panel según rol               │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │   FRONTEND (React + Vite)  │
        │                            │
        │  Páginas:                  │
        │  ├── Login / Registro      │
        │  ├── Dashboard             │
        │  ├── Usuarios (Admin)      │
        │  ├── Productos             │
        │  ├── Punto de Venta        │
        │  ├── Facturas              │
        │  ├── Reportes              │
        │  ├── Tienda (Cliente)      │
        │  └── Mis Facturas (Cliente)│
        │                            │
        │  Servicio: db.ts           │
        │  (localStorage / fetch)    │
        └─────────────┬──────────────┘
                      │ HTTP REST + SSE
        ┌─────────────▼──────────────┐
        │  BACKEND (Express + TS)    │
        │                            │
        │  Rutas:                    │
        │  ├── /api/auth    (JWT)    │
        │  ├── /api/usuarios         │
        │  ├── /api/productos        │
        │  ├── /api/facturas         │
        │  ├── /api/dashboard        │
        │  └── /api/realtime (SSE)   │
        └─────────────┬──────────────┘
                      │ TCP:5432
        ┌─────────────▼──────────────┐
        │     POSTGRESQL (DBeaver)   │
        │                            │
        │  Tablas:                   │
        │  ├── usuarios              │
        │  ├── sesiones              │
        │  ├── productos             │
        │  ├── facturas              │
        │  └── factura_detalles      │
        │                            │
        │  Vistas:                   │
        │  ├── v_facturas_completas  │
        │  ├── v_resumen_facturacion │
        │  └── v_ventas_por_vendedor │
        └────────────────────────────┘
```

---

## 4. Estructura de Carpetas

```
facturaya/
├── index.html
├── package.json
├── README.md
│
├── src/                          # FRONTEND
│   ├── main.tsx
│   ├── App.tsx                   # Rutas + protección por rol
│   ├── index.css                 # TODOS los estilos
│   │
│   ├── types/
│   │   └── index.ts              # Interfaces: Usuario, Producto, Factura, etc.
│   │
│   ├── context/
│   │   └── AuthContext.tsx        # Contexto de autenticación (login/logout/registro)
│   │
│   ├── services/
│   │   └── db.ts                 # CRUD con localStorage (simulación de BD)
│   │
│   ├── components/
│   │   ├── Sidebar.tsx           # Navegación lateral por rol
│   │   ├── Modal.tsx             # Modal reutilizable
│   │   └── Confirm.tsx           # Diálogo de confirmación
│   │
│   └── pages/
│       ├── Login.tsx             # Inicio de sesión
│       ├── Registro.tsx          # Registro de nuevos usuarios
│       ├── Dashboard.tsx         # Panel principal (Admin/Vendedor/Contador)
│       ├── Usuarios.tsx          # CRUD usuarios (Admin)
│       ├── Productos.tsx         # CRUD productos (Admin edita, Vendedor ve)
│       ├── Ventas.tsx            # Punto de venta (Admin/Vendedor)
│       ├── Facturas.tsx          # Gestión de facturas
│       ├── Reportes.tsx          # Reportes financieros (Admin/Contador)
│       ├── Tienda.tsx            # Tienda online (Cliente)
│       └── MisFacturas.tsx       # Facturas del cliente
│
├── server/                       # BACKEND
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts              # Servidor Express
│       ├── db.ts                 # Pool PostgreSQL
│       └── routes/
│           ├── auth.ts           # Login/Registro (JWT + bcrypt)
│           ├── usuarios.ts       # CRUD usuarios
│           ├── productos.ts      # CRUD productos
│           ├── facturas.ts       # CRUD facturas (con transacciones)
│           └── dashboard.ts      # Estadísticas
│
└── database/                     # SQL PARA DBEAVER
    ├── 01_schema.sql             # Estructura completa (tablas, triggers, vistas)
    └── 02_seed.sql               # Datos de prueba (usuarios, productos, facturas)
```

---

## 5. Diagrama de Flujo

```
                    ┌────────────┐
                    │  INICIO    │
                    └─────┬──────┘
                          ▼
                  ┌───────────────┐
                  │ ¿Tiene cuenta?│
                  └───┬───────┬───┘
                  Sí  │       │ No
                      ▼       ▼
               ┌─────────┐ ┌──────────┐
               │  LOGIN   │ │ REGISTRO │
               └────┬─────┘ └────┬─────┘
                    └──────┬──────┘
                           ▼
                  ┌────────────────┐
                  │  ¿Qué rol?     │
                  └──┬──┬──┬──┬────┘
        Admin ◄──────┘  │  │  └──────► Cliente
        Vendedor ◄──────┘  └──────► Contador
                    │         │          │          │
                    ▼         ▼          ▼          ▼
             ┌──────────┐┌────────┐┌─────────┐┌─────────┐
             │Dashboard ││Dashbrd ││Dashboard││ TIENDA  │
             │Usuarios  ││Productos││Facturas ││Comprar  │
             │Productos ││Ventas  ││Reportes ││productos│
             │Ventas    ││Facturas││         ││         │
             │Facturas  ││        ││         ││MIS      │
             │Reportes  ││        ││         ││FACTURAS │
             └──────────┘└────────┘└─────────┘└─────────┘

Flujo de venta (Admin/Vendedor):
  1. Seleccionar cliente
  2. Agregar productos al detalle
  3. Elegir método de pago
  4. Emitir factura → se descuenta stock

Flujo de compra (Cliente):
  1. Explorar productos en la tienda
  2. Agregar al carrito
  3. Finalizar compra → factura generada
  4. Ver factura en "Mis Facturas"

Flujo de factura:
  EMITIDA → PAGADA (vendedor/admin marca)
  EMITIDA → ANULADA (vendedor/admin anula)
```

---

## 6. Base de Datos PostgreSQL

### Diagrama ER

```
┌─────────────────┐          ┌──────────────────────┐
│    USUARIOS     │          │      PRODUCTOS       │
├─────────────────┤          ├──────────────────────┤
│ id       UUID PK│          │ id         UUID PK   │
│ nombre  VARCHAR │          │ codigo   VARCHAR UQ  │
│ email  VARCHAR UQ│          │ nombre   VARCHAR     │
│ password VARCHAR│          │ descripcion TEXT     │
│ rol    ENUM     │          │ precio   DECIMAL     │
│ empresa VARCHAR │          │ impuesto DECIMAL     │
│ ruc    VARCHAR  │          │ stock    INTEGER     │
│ telefono VARCHAR│          │ categoria VARCHAR    │
│ direccion VARCHAR│          │ activo   BOOLEAN     │
│ activo  BOOLEAN │          │ created_at TIMESTAMP │
│ created_at      │          │ updated_at TIMESTAMP │
│ updated_at      │          └──────────┬───────────┘
└──┬──────────┬───┘                     │
   │          │                         │
   │ cliente  │ vendedor                │ producto
   │ (FK)     │ (FK)                    │ (FK)
   ▼          ▼                         │
┌──────────────────────────────────┐    │
│           FACTURAS               │    │
├──────────────────────────────────┤    │
│ id             UUID PK           │    │
│ numero        VARCHAR UQ         │    │
│ cliente_id    UUID FK→usuarios   │    │
│ vendedor_id   UUID FK→usuarios   │    │
│ fecha         DATE               │    │
│ subtotal      DECIMAL            │    │
│ impuesto_total DECIMAL           │    │
│ total         DECIMAL            │    │
│ estado        ENUM               │    │
│ metodo_pago   VARCHAR            │    │
│ notas         TEXT               │    │
│ created_at    TIMESTAMP          │    │
│ updated_at    TIMESTAMP          │    │
└──────────────┬───────────────────┘    │
               │ 1:N (CASCADE)         │
               ▼                        │
┌──────────────────────────────────┐    │
│       FACTURA_DETALLES           │◄───┘
├──────────────────────────────────┤
│ id             UUID PK           │
│ factura_id    UUID FK→facturas   │
│ producto_id   UUID FK→productos  │
│ cantidad      INTEGER            │
│ precio_unitario DECIMAL          │
│ impuesto      DECIMAL            │
│ subtotal      DECIMAL            │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│          SESIONES                │
├──────────────────────────────────┤
│ id           UUID PK             │
│ usuario_id  UUID FK→usuarios     │
│ token       VARCHAR              │
│ ip          VARCHAR              │
│ activa      BOOLEAN              │
│ created_at  TIMESTAMP            │
│ expires_at  TIMESTAMP            │
└──────────────────────────────────┘
```

### Montar en DBeaver — Paso a Paso

```bash
# PASO 1: Crear la base de datos
# En psql o DBeaver SQL Editor como superuser:
CREATE DATABASE facturaya;

# PASO 2: Conectar en DBeaver
# Nueva conexión → PostgreSQL
# Host: localhost | Puerto: 5432 | Database: facturaya
# User: postgres  | Password: (tu contraseña)
# → Test Connection → OK → Finish

# PASO 3: Abrir SQL Editor (Ctrl+])
# Copiar y ejecutar database/01_schema.sql
# (Crea tablas, índices, triggers, vistas, funciones)

# PASO 4: Ejecutar database/02_seed.sql
# (Inserta 6 usuarios, 10 productos, 4 facturas)

# PASO 5: Verificar
SELECT nombre, email, rol FROM usuarios;
SELECT codigo, nombre, precio, stock FROM productos;
SELECT * FROM v_facturas_completas;
SELECT * FROM v_resumen_facturacion;
SELECT * FROM v_ventas_por_vendedor;
```

### Elementos de la BD

| Tipo       | Nombre                   | Descripción                            |
|------------|--------------------------|----------------------------------------|
| Tabla      | `usuarios`               | Usuarios con roles                     |
| Tabla      | `sesiones`               | Control de sesiones JWT                |
| Tabla      | `productos`              | Catálogo con stock                     |
| Tabla      | `facturas`               | Encabezados de factura                 |
| Tabla      | `factura_detalles`       | Líneas de cada factura                 |
| Enum       | `rol_tipo`               | admin, vendedor, contador, cliente     |
| Enum       | `factura_estado`         | pendiente, emitida, pagada, anulada    |
| Vista      | `v_facturas_completas`   | Facturas + cliente + vendedor          |
| Vista      | `v_resumen_facturacion`  | Totales para dashboard                 |
| Vista      | `v_ventas_por_vendedor`  | Ventas agrupadas por vendedor          |
| Función    | `fn_next_factura_numero` | Genera FAC-000001, FAC-000002...       |
| Función    | `fn_update_timestamp`    | Actualiza updated_at                   |
| Función    | `fn_descontar_stock`     | Descuenta stock al facturar            |
| Trigger    | `trg_usuarios_timestamp` | Auto-update en usuarios                |
| Trigger    | `trg_productos_timestamp`| Auto-update en productos               |
| Trigger    | `trg_facturas_timestamp` | Auto-update en facturas                |
| Trigger    | `trg_descontar_stock`    | Descuenta stock al insertar detalle    |
| Índice     | 14 índices               | Para búsquedas optimizadas             |

---

## 7. API REST — Endpoints

### Base: `http://localhost:3001/api`

#### Autenticación

| Método | Endpoint             | Body                                                    |
|--------|----------------------|---------------------------------------------------------|
| POST   | `/api/auth/login`    | `{ email, password }`                                   |
| POST   | `/api/auth/registro` | `{ nombre, email, password, rol, empresa, ruc, ... }`   |

#### Usuarios (Admin)

| Método | Endpoint             | Descripción       |
|--------|----------------------|-------------------|
| GET    | `/api/usuarios`      | Listar todos      |
| GET    | `/api/usuarios/:id`  | Obtener uno       |
| PUT    | `/api/usuarios/:id`  | Actualizar        |
| DELETE | `/api/usuarios/:id`  | Eliminar          |

#### Productos

| Método | Endpoint              | Descripción       |
|--------|-----------------------|-------------------|
| GET    | `/api/productos`      | Listar todos      |
| GET    | `/api/productos/:id`  | Obtener uno       |
| POST   | `/api/productos`      | Crear             |
| PUT    | `/api/productos/:id`  | Actualizar        |
| DELETE | `/api/productos/:id`  | Eliminar          |

#### Facturas

| Método | Endpoint             | Descripción                    |
|--------|----------------------|--------------------------------|
| GET    | `/api/facturas`      | Listar (filtros: estado, cliente_id, vendedor_id) |
| GET    | `/api/facturas/:id`  | Detalle con líneas             |
| POST   | `/api/facturas`      | Crear con transacción          |
| PUT    | `/api/facturas/:id`  | Cambiar estado/notas           |
| DELETE | `/api/facturas/:id`  | Eliminar (cascade)             |

#### Dashboard

| Método | Endpoint               | Descripción          |
|--------|------------------------|----------------------|
| GET    | `/api/dashboard/stats` | Estadísticas globales|

#### Tiempo real

| Método | Endpoint          | Descripción |
|--------|-------------------|-------------|
| GET    | `/api/realtime`   | Stream SSE con eventos de altas, cambios y eliminaciones |

---

## 8. Instalación Paso a Paso

### Requisitos

- Node.js 18+
- PostgreSQL 14+
- DBeaver (opcional, para gestión visual)

### A) Frontend aislado de referencia

```bash
npm install
npm run build
# Abrir dist/index.html
```

> Nota: el flujo principal del proyecto usa backend real; esta opción solo aplica si quieres generar la versión estática.

### B) Sistema completo (Frontend + Backend + PostgreSQL)

```bash
# 1. Base de datos
psql -U postgres -c "CREATE DATABASE facturaya;"
psql -U postgres -d facturaya -f database/01_schema.sql
psql -U postgres -d facturaya -f database/02_seed.sql

# 2. Backend
cd server
npm install
cp .env.example .env
# Editar .env con tu contraseña de PostgreSQL
npm run dev
# → http://localhost:3001/api
# → también expone http://localhost:3001/api/realtime para la sincronización en vivo

# 3. Frontend
cd ..
npm install
npm run dev
# → http://localhost:5173
```

---

## 9. Manual de Uso

### Login
1. Abre la aplicación → aparece la pantalla de login
2. Usa una cuenta de prueba o crea una nueva en "Regístrate aquí"
3. Según tu rol, verás un menú lateral diferente

### Admin
- **Dashboard**: Totales de facturas, clientes, productos, ingresos
- **Usuarios**: Crear, editar, eliminar usuarios. Asignar roles
- **Productos**: CRUD completo con código, precio, stock, categoría
- **Punto de Venta**: Seleccionar cliente → agregar productos → emitir factura
- **Facturas**: Ver todas, cambiar estado, eliminar
- **Reportes**: Ventas por vendedor, top clientes, métodos de pago

### Vendedor
- **Dashboard**: Su resumen de ventas
- **Productos**: Ver catálogo (sin editar)
- **Punto de Venta**: Crear facturas para clientes
- **Mis Facturas**: Solo las facturas que él generó

### Contador
- **Dashboard**: Resumen financiero
- **Facturas**: Ver todas (solo lectura, no puede modificar)
- **Reportes**: Análisis completo de ingresos e impuestos

### Cliente
- **Tienda**: Ver productos, agregar al carrito, comprar
- **Mis Facturas**: Ver el historial de compras, imprimir facturas

---

## 10. Documentación del Código

### `src/context/AuthContext.tsx`
Contexto React que maneja la sesión del usuario. Provee `login()`, `registro()`,
`logout()` y `user` (usuario actual). Consume la API real y persiste la sesión en `localStorage`.

### `src/services/db.ts`
Capa de datos del frontend que consume la API real. Contiene:
- `request()`: helper común para llamadas REST
- CRUD completo para usuarios, productos, facturas
- `createFactura()`: crea la factura y su detalle vía API
- `getStats()`: Estadísticas para dashboard

### `src/components/Sidebar.tsx`
Menú lateral que muestra opciones según el rol del usuario logueado.
Admin ve 6 opciones, Vendedor 4, Contador 3, Cliente 2.

### `src/pages/Login.tsx` y `Registro.tsx`
Formularios de autenticación con validación y toggle de contraseña.

---

## 11. Errores solucionados hasta ahora
### 2026-05-18 — Corrección: arranque del frontend con `npm run dev --host`

- Problema: El comando `npm run dev --host` fallaba con código de salida 1 al iniciar el servidor de desarrollo (Vite/esbuild).
- Solución: Ajustada la configuración del servidor de desarrollo en `vite.config.ts` y el script `dev` en `package.json` para soportar `--host`; se revisaron importaciones ESM y dependencias relacionadas.
- Archivos tocados: `vite.config.ts`, `package.json`, `src/main.tsx`.

### Frontend y TypeScript
- Se corrigieron importaciones ESM para `moduleResolution: "node16"` agregando extensiones explícitas (`.ts` / `.tsx`) donde era necesario.
- Se resolvió el error de `src/main.tsx` declarando módulos CSS para TypeScript.
- Se repararon los errores de `Sidebar.tsx` relacionados con el tipo del ícono y la importación de `AuthContext`.

### Tailwind y estilos
- Se eliminó el error de `Cannot apply unknown utility class 'p-4'` en `src/index.css`.
- Se ajustó la configuración de Tailwind/PostCSS para que el proyecto compile sin el plugin que estaba rompiendo `@apply`.
- Se instaló la dependencia faltante `autoprefixer` para que PostCSS cargue correctamente.

### Backend y base de datos
- Se solucionaron los errores de conexión PostgreSQL/SASL dejando la contraseña configurada correctamente en `server/.env`.
- Se aplicó el schema y seed de la base para crear tablas y datos de prueba.
- Se añadió la migración `image_url` para la tabla `productos`.

### Funcionalidad de negocio
- Se reemplazó el mock de `localStorage` por un cliente HTTP real en `src/services/db.ts`.
- Se actualizó el login para consumir la API real y se retiraron los usuarios de prueba del formulario.
- Se agregó soporte para imágenes de productos por URL en admin y tienda.
- Se cambió la visualización de precios de productos a USD en pantalla.
- Se añadió sincronización en tiempo real con SSE para refrescar automáticamente dashboard, productos, facturas, reportes, ventas, tienda y mis facturas.

### Archivos clave tocados
- `src/services/db.ts`
- `src/context/AuthContext.tsx`
- `src/pages/*.tsx`
- `src/index.css`
- `vite.config.ts`
- `package.json`
- `tsconfig.json`
- `server/src/routes/productos.ts`
- `database/01_schema.sql`
- `database/02_seed.sql`
- `database/03_add_producto_image_url.sql`
- `server/src/realtime.ts`
- `src/services/realtime.ts`
- `src/hooks/useRealtimeRefresh.ts`

---

*FacturaYa v2 — Sistema completo de facturación electrónica*

### `src/pages/Ventas.tsx`
Punto de venta con:
- Selector de cliente (dropdown de usuarios rol=cliente)
- Selector de producto + cantidad
- Tabla de detalles con cálculos automáticos
- Panel lateral con totales y botón de emitir

### `src/pages/Tienda.tsx`
Vista de compra para clientes con:
- Grid de productos con filtros por categoría
- Carrito lateral con controles de cantidad
- Cálculo de impuestos y total
- Botón de finalizar compra

### `server/src/routes/auth.ts`
Login con verificación bcrypt + generación de JWT.
Registro con hash de contraseña y creación de sesión.

### `server/src/routes/facturas.ts`
CRUD con transacciones PostgreSQL para crear factura + detalles atómicamente.
Usa `fn_next_factura_numero()` para secuencia automática.

### `database/01_schema.sql`
Schema completo: 5 tablas, 2 enums, 3 vistas, 3 funciones,
4 triggers, 14 índices. Todo documentado con COMMENT ON.

### `database/02_seed.sql`
Datos de prueba: 6 usuarios (1 admin, 1 vendedor, 1 contador,
3 clientes), 10 productos, 4 facturas con detalles.

---

*FacturaYa v2 — Sistema completo de facturación electrónica*
