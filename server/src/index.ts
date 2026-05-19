/*
  BACKEND API — FACTS

  Este archivo arranca el servidor Express y monta las rutas REST que
  componen la API del backend. TODOS los endpoints deben implementarse
  en la carpeta `server/src/routes/` y en la capa de acceso a datos
  (`server/src/db.ts`).

  IMPORTANTE: El frontend no debe contener lógica de servidor ni
  definir endpoints HTTP. El frontend solo debe consumir esta API
  mediante el cliente HTTP (ej. `src/services/db.ts`) o a través de
  `VITE_API_URL` apuntando a este servidor.

  Si necesitas añadir o modificar endpoints, edita los ficheros en
  `server/src/routes/` y reinicia el proceso del servidor.
*/

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import usuariosRouter from './routes/usuarios';
import productosRouter from './routes/productos';
import facturasRouter from './routes/facturas';
import dashboardRouter from './routes/dashboard';
import { realtimeStream } from './realtime';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rutas
app.use('/api/auth',      authRouter);
app.use('/api/usuarios',  usuariosRouter);
app.use('/api/productos', productosRouter);
app.use('/api/facturas',  facturasRouter);
app.use('/api/dashboard', dashboardRouter);
app.get('/api/realtime', realtimeStream);

app.get('/api', (_req, res) => {
  res.json({
    sistema: 'FacturaYa API v2',
    endpoints: {
      auth: ['POST /api/auth/login', 'POST /api/auth/registro'],
      usuarios: ['GET /api/usuarios', 'GET/PUT/DELETE /api/usuarios/:id'],
      productos: ['GET/POST /api/productos', 'GET/PUT/DELETE /api/productos/:id'],
      facturas: ['GET/POST /api/facturas', 'GET/PUT/DELETE /api/facturas/:id'],
      dashboard: ['GET /api/dashboard/stats'],
    },
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FACTS v2 → http://0.0.0.0:${PORT}/api`);
});
