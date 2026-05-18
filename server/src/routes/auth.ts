// AUTH — Login y Registro con JWT + bcrypt
//
// Ruta responsable de autenticar usuarios y crear cuentas.
// Punto clave:
// - `/login`: valida credenciales, genera JWT y guarda sesión en tabla `sesiones`.
// - `/registro`: crea usuario (password con bcrypt) y devuelve token.
//
// NOTA: el token se firma con `JWT_SECRET` y se almacena en `sesiones`.
import { Router } from 'express';
// Router de Express para definir rutas modulares

import pool from '../db';
// Pool de PostgreSQL exportado desde server/src/db.ts

import bcrypt from 'bcryptjs';
// Biblioteca para hashear y comparar contraseñas

import jwt from 'jsonwebtoken';
// Biblioteca para firmar/verificar JWT

import { emitRealtime } from '../realtime';

const router = Router();
// Instancia de router para agrupar endpoints de /api/auth

const SECRET = process.env.JWT_SECRET || 'facturaya_secret';
// Clave secreta para firmar JWT — debe venir de .env en producción

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    // Extraer credenciales del body
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    // Buscar usuario activo por email
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND activo = TRUE', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = result.rows[0];
    // Comparar contraseña enviada con hash almacenado
    const valid = await bcrypt.compare(password, user.password);
    // En desarrollo puede existir password plano como fallback
    if (!valid && user.password !== password) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Generar JWT con id y rol, expiración 24h
    const token = jwt.sign({ id: user.id, rol: user.rol }, SECRET, { expiresIn: '24h' });

    // Registrar la sesión en la tabla `sesiones` (auditoría/control)
    await pool.query('INSERT INTO sesiones (usuario_id, token) VALUES ($1, $2)', [user.id, token]);

    // Remover campo password del usuario antes de enviar la respuesta
    const { password: _, ...userData } = user;
    res.json({ usuario: userData, token });
  } catch (err) {
    // Error genérico del servidor
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    // Extraer datos del body
    const { nombre, email, password, rol, empresa, ruc, telefono, direccion } = req.body;
    if (!nombre || !email || !password) return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });

    // Verificar que el email no exista
    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) return res.status(409).json({ error: 'El email ya está registrado' });

    // Hashear la contraseña con bcrypt antes de insertar
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, empresa, ruc, telefono, direccion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nombre, email, hash, rol || 'cliente', empresa || '', ruc || '', telefono || '', direccion || '']
    );

    const user = result.rows[0];
    const { password: _, ...userData } = user;

    emitRealtime({
      type: 'sync',
      entity: 'usuarios',
      action: 'register',
      id: user.id,
      timestamp: new Date().toISOString(),
      payload: userData,
    });

    // Generar token y devolver usuario creado (sin password)
    const token = jwt.sign({ id: user.id, rol: user.rol }, SECRET, { expiresIn: '24h' });
    res.status(201).json({ usuario: userData, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
