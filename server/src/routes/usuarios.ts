// USUARIOS — CRUD (Admin)
//
// Rutas para administrar usuarios. Pensadas para uso por Administrador:
// - GET /api/usuarios          → listar usuarios (sin password)
// - GET /api/usuarios/:id      → obtener un usuario
// - PUT /api/usuarios/:id      → actualizar (incluye hash de password si viene)
// - DELETE /api/usuarios/:id   → eliminar (maneja FK con facturas)
import { Router } from 'express';
import pool from '../db';
import bcrypt from 'bcryptjs';
import { emitRealtime } from '../realtime';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    // Lista usuarios sin exponer contraseñas
    const r = await pool.query("SELECT id,nombre,email,rol,profile_image_url,empresa,ruc,telefono,direccion,activo,created_at FROM usuarios ORDER BY created_at");
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    // Obtener un usuario por id (sin password)
    const r = await pool.query("SELECT id,nombre,email,rol,profile_image_url,empresa,ruc,telefono,direccion,activo FROM usuarios WHERE id=$1", [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    // Actualiza campos de usuario; permitimos actualizaciones parciales
    const { nombre, email, password, rol, profile_image_url, empresa, ruc, telefono, direccion, activo } = req.body;
    let hash = undefined; // si viene password, lo hasheamos
    if (password) hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `UPDATE usuarios SET
        nombre=COALESCE($1,nombre), email=COALESCE($2,email),
        password=COALESCE($3,password), rol=COALESCE($4,rol),
        profile_image_url=COALESCE($5,profile_image_url), empresa=COALESCE($6,empresa), ruc=COALESCE($7,ruc),
        telefono=COALESCE($8,telefono), direccion=COALESCE($9,direccion),
        activo=COALESCE($10,activo)
       WHERE id=$11 RETURNING id,nombre,email,rol,profile_image_url,empresa,ruc,telefono,direccion,activo`,
      [nombre, email, hash, rol, profile_image_url, empresa, ruc, telefono, direccion, activo, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    emitRealtime({
      type: 'sync',
      entity: 'usuarios',
      action: 'update',
      id: req.params.id,
      timestamp: new Date().toISOString(),
      payload: r.rows[0],
    });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    // Eliminar usuario; puede fallar con FK si tiene facturas
    const r = await pool.query('DELETE FROM usuarios WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    emitRealtime({
      type: 'sync',
      entity: 'usuarios',
      action: 'delete',
      id: req.params.id,
      timestamp: new Date().toISOString(),
    });
    res.json({ message: 'Eliminado', id: req.params.id });
  } catch (e: any) {
    // Código 23503 => restricción de integridad (FK)
    if (e.code === '23503') return res.status(409).json({ error: 'Tiene facturas asociadas' });
    res.status(500).json({ error: 'Error' });
  }
});

export default router;
