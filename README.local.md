# Ejecutar el proyecto localmente

Este archivo contiene los pasos mínimos para dejar el proyecto 100% funcional en tu máquina local sin tocar Render.

Requisitos
- Node.js (v18+ o la que ya usas)
- PostgreSQL (local) o Docker
- PowerShell / terminal

Pasos rápidos

1) Levantar Postgres (opción local o Docker)

Opción A — Postgres instalado localmente:
```powershell
createdb -U postgres facturaya
```

Opción B — Docker (si no tienes Postgres):
```powershell
docker run --name pg-facts -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
docker exec -it pg-facts psql -U postgres -c "CREATE DATABASE facturaya;"
```

2) Ejecutar schema + seed en la DB

En PowerShell (desde la raíz del repo):
```powershell
#$env:DATABASE_URL debe apuntar a tu Postgres local
#$env:DATABASE_URL = "postgresql://postgres:TU_PASS_LOCAL@localhost:5432/facturaya?sslmode=disable"
node .\scripts\run-sql.cjs .\database\01_schema.sql .\database\02_seed.sql
node .\scripts\run-sql.cjs .\database\03_add_producto_image_url.sql .\database\04_metodos_pago.sql || echo 'OK if missing'
node .\scripts\run-verify.cjs
```

3) Arrancar backend en desarrollo

```powershell
cd server
#$env:DATABASE_URL = "postgresql://postgres:TU_PASS_LOCAL@localhost:5432/facturaya?sslmode=disable"
npm ci
npm run dev
```

4) Arrancar frontend (Vite)

Desde la raíz:
```powershell
npm ci
#$env:VITE_API_URL = "http://localhost:3001" # si tu backend corre en 3001
npm run dev
```

5) Probar login (API)

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/auth/login -ContentType 'application/json' -Body '{"email":"admin@facturaya.com","password":"admin123"}'
```

Notas importantes
- No subas credenciales al repo. Si alguna vez las subiste, rótalas.
- `dist/` ya está en `.gitignore`; no debes subir builds al el repositorio.
- Los scripts en `scripts/` permiten exportar/importar datos: úsalos solo en entornos controlados.
- No lanzaremos deploy en Render hasta que tú lo indiques explícitamente.

Si quieres, puedo añadir aquí comandos para Windows con PowerShell paso-a-paso o para macOS/Linux (bash). Dime cuál prefieres.