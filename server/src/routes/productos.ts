// PRODUCTOS — CRUD
//
// Rutas para gestión del catálogo de productos:
// - GET /api/productos         → listar productos
// - GET /api/productos/:id     → obtener detalle
// - POST /api/productos        → crear (validación mínima: codigo, nombre)
// - PUT /api/productos/:id     → actualizar campos (COALESCE para parcial)
// - DELETE /api/productos/:id  → eliminar (maneja FK con facturas)
import { Router } from 'express';
import pool from '../db';
import { emitRealtime } from '../realtime';
import { crearNotificacion } from '../notificaciones';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    // Devuelve listado completo de productos ordenados por código
    res.json((await pool.query('SELECT * FROM productos ORDER BY codigo')).rows);
  } catch { res.status(500).json({ error: 'Error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    // Obtener producto por id
    const r = await pool.query('SELECT * FROM productos WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Error' }); }
});

router.post('/', async (req, res) => {
  try {
    // Crear nuevo producto — parámetros esperados en el body
    const { codigo, nombre, descripcion, image_url, precio, impuesto, stock, categoria, usuario_id } = req.body;
    if (!codigo || !nombre) return res.status(400).json({ error: 'Código y nombre obligatorios' });
    const r = await pool.query(
      `INSERT INTO productos (codigo,nombre,descripcion,image_url,precio,impuesto,stock,categoria)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [codigo, nombre, descripcion||'', image_url||'', precio||0, impuesto||18, stock||0, categoria||'']
    );
    emitRealtime({
      type: 'sync',
      entity: 'productos',
      action: 'create',
      id: r.rows[0].id,
      timestamp: new Date().toISOString(),
      payload: r.rows[0],
    });
    // Crear notificación para el admin que agregó el producto
    if (usuario_id) {
      await crearNotificacion({
        usuario_id,
        tipo: 'producto_agregado',
        titulo: 'Producto agregado',
        mensaje: `Agregaste el producto ${nombre} (${codigo}) al catálogo.`,
        data: { producto_id: r.rows[0].id }
      });
    }
    res.status(201).json(r.rows[0]);
  } catch (e: any) {
    // 23505 => violación de unicidad (código duplicado)
    if (e.code === '23505') return res.status(409).json({ error: 'Código duplicado' });
    res.status(500).json({ error: 'Error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    // Actualiza producto de forma parcial usando COALESCE
    const { codigo, nombre, descripcion, image_url, precio, impuesto, stock, categoria, activo } = req.body;
    const r = await pool.query(
      `UPDATE productos SET
        codigo=COALESCE($1,codigo), nombre=COALESCE($2,nombre),
        descripcion=COALESCE($3,descripcion), image_url=COALESCE($4,image_url),
        precio=COALESCE($5,precio), impuesto=COALESCE($6,impuesto),
        stock=COALESCE($7,stock), categoria=COALESCE($8,categoria),
        activo=COALESCE($9,activo)
       WHERE id=$10 RETURNING *`,
      [codigo, nombre, descripcion, image_url, precio, impuesto, stock, categoria, activo, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    emitRealtime({
      type: 'sync',
      entity: 'productos',
      action: 'update',
      id: req.params.id,
      timestamp: new Date().toISOString(),
      payload: r.rows[0],
    });
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    // Eliminar producto; puede fallar si está referenciado en facturas
    const r = await pool.query('DELETE FROM productos WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    emitRealtime({
      type: 'sync',
      entity: 'productos',
      action: 'delete',
      id: req.params.id,
      timestamp: new Date().toISOString(),
    });
    res.json({ message: 'Eliminado' });
  } catch (e: any) {
    if (e.code === '23503') return res.status(409).json({ error: 'Producto en facturas existentes' });
    res.status(500).json({ error: 'Error' });
  }
});

export default router;
