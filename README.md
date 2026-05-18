# FacturaYa v2 — Sistema de Facturación

Sistema de facturación electrónica con login, 4 roles de usuario (Admin, Vendedor, Contador, Cliente), tienda online, punto de venta y PostgreSQL.

## Inicio rápido

Cuentas de prueba:
- Admin: `admin@facturaya.com` / `admin123`
- Vendedor: `maria@facturaya.com` / `maria123`
- Contador: `jorge@facturaya.com` / `jorge123`
- Cliente: `ana@empresa.com` / `ana123`

## Qué hace cada rol

- **Admin**: Dashboard, usuarios, productos, punto de venta, facturas, reportes
- **Vendedor**: Dashboard, ver productos, punto de venta, mis facturas
- **Contador**: Dashboard, ver facturas, reportes financieros
- **Cliente**: Tienda para comprar, ver mis facturas

## Instalación

### 1. Base de datos

```bash
psql -U postgres -c "CREATE DATABASE facturaya;"
psql -U postgres -d facturaya -f database/01_schema.sql
psql -U postgres -d facturaya -f database/02_seed.sql
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# Editar .env con tu contraseña de PostgreSQL
npm run dev
# → http://localhost:3001/api
```

### 3. Frontend

```bash
cd ..
npm install
npm run dev
# → http://localhost:5173
```

## Endpoints API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Login con JWT |
| POST | `/auth/registro` | Crear cuenta |
| GET | `/usuarios` | Listar usuarios |
| GET/PUT/DELETE | `/usuarios/:id` | CRUD usuario |
| GET | `/productos` | Listar productos |
| POST/PUT/DELETE | `/productos` | CRUD producto |
| GET | `/facturas` | Listar facturas |
| POST | `/facturas` | Crear factura |
| PUT/DELETE | `/facturas/:id` | Editar/eliminar factura |
| GET | `/dashboard/stats` | Estadísticas |
| GET | `/realtime` | Stream SSE (sincronización en vivo) |

## Stack tecnológico

- **Frontend**: React + TypeScript + Tailwind + Vite
- **Backend**: Express + TypeScript + JWT + bcrypt
- **BD**: PostgreSQL + triggers + vistas
- **Realtime**: Server-Sent Events (SSE)
