import { Pool } from 'pg';
// Importa el paquete 'pg' y extrae la clase Pool

import dotenv from 'dotenv';
// Carga variables de entorno desde .env (si existe)

dotenv.config();
// Ejecuta la carga de variables de entorno inmediatamente

function getPgConfig() {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    // If connecting to a hosted provider (e.g. Render) or the connection
    // string requests SSL, enable SSL with relaxed cert verification so the
    // client can connect from the platform. Allow forcing via FORCE_PG_SSL.
    const needSsl = connectionString.includes('render.com') || connectionString.includes('sslmode=require') || process.env.FORCE_PG_SSL === 'true';
    return {
      connectionString,
      ssl: needSsl ? { rejectUnauthorized: false } : undefined,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'facturaya',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  };
}

/*
  DB Pool — configuración y exportación

  Este módulo crea y exporta un `Pool` de conexiones de PostgreSQL.
  Cada clave abajo se lee desde `process.env` y tiene un fallback.
*/

const pool = new Pool(getPgConfig());

// Evento 'connect' para confirmar conexión exitosa
pool.on('connect', () => console.log('✅ PostgreSQL conectado'));

// Evento 'error' para capturar errores globales del pool
pool.on('error', (err) => console.error('❌ PostgreSQL error:', err));

// Exporta el pool para que otras partes del backend lo reutilicen
export default pool;
