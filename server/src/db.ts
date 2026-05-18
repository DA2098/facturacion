import { Pool } from 'pg';
// Importa el paquete 'pg' y extrae la clase Pool

import dotenv from 'dotenv';
// Carga variables de entorno desde .env (si existe)

dotenv.config();
// Ejecuta la carga de variables de entorno inmediatamente

/*
  DB Pool — configuración y exportación

  Este módulo crea y exporta un `Pool` de conexiones de PostgreSQL.
  Cada clave abajo se lee desde `process.env` y tiene un fallback.
*/

const pool = new Pool({
  // host del servidor PostgreSQL (por defecto 'localhost')
  host: process.env.DB_HOST || 'localhost',
  // puerto del servidor PostgreSQL (por defecto 5432)
  port: parseInt(process.env.DB_PORT || '5432'),
  // nombre de la base de datos
  database: process.env.DB_NAME || 'facturaya',
  // usuario de la base de datos
  user: process.env.DB_USER || 'postgres',
  // contraseña (asegúrate de actualizar .env en producción)
  password: process.env.DB_PASSWORD || 'password',
});

// Evento 'connect' para confirmar conexión exitosa
pool.on('connect', () => console.log('✅ PostgreSQL conectado'));

// Evento 'error' para capturar errores globales del pool
pool.on('error', (err) => console.error('❌ PostgreSQL error:', err));

// Exporta el pool para que otras partes del backend lo reutilicen
export default pool;
