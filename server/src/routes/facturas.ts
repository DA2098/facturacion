// FACTURAS — CRUD con transacciones
//
// Rutas que manejan facturación completa. Notas clave:
// - Usa la vista `v_facturas_completas` para listar/obtener facturas con datos
//   de cliente/vendedor.
// - `POST /api/facturas` crea factura y sus líneas dentro de una transacción
//   para asegurar integridad; inserta en `facturas` y `factura_detalles`.
// - Los cálculos de subtotal/impuesto se realizan en el servidor antes de
//   insertar.
import { Router } from 'express';
import pool from '../db';
import { emitRealtime } from '../realtime';
import { getAutopagoConfig, scheduleFacturaAutopago, sweepAutopagoFacturas } from '../autopago';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await sweepAutopagoFacturas();
    const { estado, cliente_id, vendedor_id } = req.query;
    let q = 'SELECT * FROM v_facturas_completas WHERE 1=1';
    const params: any[] = [];
    let i = 1;
    if (estado && estado !== 'todos') { q += ` AND estado = $${i++}`; params.push(estado); }
    if (cliente_id) { q += ` AND cliente_id = $${i++}`; params.push(cliente_id); }
    if (vendedor_id) { q += ` AND vendedor_id = $${i++}`; params.push(vendedor_id); }
    q += ' ORDER BY created_at DESC';
    res.json((await pool.query(q, params)).rows);
  } catch (e: any) { console.error(e); res.status(500).json({ error: e?.message || 'Error' }); }
});

router.get('/metodos-pago', async (_req, res) => {
  try {
    const rows = await pool.query(
      `SELECT nombre
       FROM metodos_pago
       WHERE activo = true
       ORDER BY orden, nombre`
    );
    const methods = rows.rows.map((row: any) => row.nombre).filter(Boolean);
    const catalog = methods.length > 0
      ? methods
      : ['Efectivo', 'Tarjeta', 'Transferencia', 'Crédito'];
    res.json(catalog);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || 'Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await sweepAutopagoFacturas();
    const fac = await pool.query('SELECT * FROM v_facturas_completas WHERE id=$1', [req.params.id]);
    if (!fac.rows.length) return res.status(404).json({ error: 'No encontrada' });
    const det = await pool.query(
      `SELECT fd.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
       FROM factura_detalles fd JOIN productos p ON fd.producto_id=p.id
       WHERE fd.factura_id=$1`, [req.params.id]);
    res.json({ ...fac.rows[0], detalles: det.rows });
  } catch (e: any) { console.error(e); res.status(500).json({ error: e?.message || 'Error' }); }
});

router.post('/', async (req, res) => {
  // Operación transaccional: obtenemos un cliente y controlamos BEGIN/COMMIT
  console.log('POST /api/facturas called');
  console.log('request body preview:', JSON.stringify(req.body).slice(0, 2000));
  const client = await pool.connect();
  try {
    const { cliente_id, vendedor_id, metodo_pago, notas, detalles, canal_venta = 'venta' } = req.body;
    if (!cliente_id || !vendedor_id || !detalles?.length) return res.status(400).json({ error: 'Datos incompletos' });

    await client.query('BEGIN');

    let subtotal = 0, imp = 0;
    // Insertar líneas de factura (detalles)
    for (const d of detalles) {
      const sub = d.cantidad * d.precio_unitario;
      subtotal += sub;
      imp += sub * (d.impuesto / 100);
    }

    const numero = (await client.query('SELECT fn_next_factura_numero() AS num')).rows[0].num;
    const config = await getAutopagoConfig();
    const autopagoActivo = canal_venta === 'tienda' && config.activo && config.minutos > 0;
    const estadoInicial = autopagoActivo ? 'pendiente' : 'emitida';
    // Pass minutes as integer (or null) and build interval in SQL safely
    const pagoProgramadoPara = autopagoActivo ? Number(config.minutos || 0) : null;
    const fac = await client.query(
      `INSERT INTO facturas (
        numero,cliente_id,vendedor_id,subtotal,impuesto_total,total,estado,metodo_pago,notas,canal_venta,pago_programado_para
       )
        VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        CASE WHEN $11 IS NULL THEN NULL ELSE CURRENT_TIMESTAMP + ($11::text || ' minutes')::interval END
       ) RETURNING *`,
      [numero, cliente_id, vendedor_id, subtotal, imp, subtotal+imp, estadoInicial, metodo_pago||'Efectivo', notas||'', canal_venta, pagoProgramadoPara]
    );

    for (const d of detalles) {
      await client.query(
        `INSERT INTO factura_detalles (factura_id,producto_id,cantidad,precio_unitario,impuesto,subtotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [fac.rows[0].id, d.producto_id, d.cantidad, d.precio_unitario, d.impuesto, d.cantidad*d.precio_unitario]
      );
    }

    await client.query('COMMIT');
    if (fac.rows[0].estado === 'pendiente') {
      const scheduled = await scheduleFacturaAutopago(fac.rows[0].id, config.minutos);
      if (scheduled) fac.rows[0] = scheduled;
    }
    emitRealtime({
      type: 'sync',
      entity: 'facturas',
      action: 'create',
      id: fac.rows[0].id,
      timestamp: new Date().toISOString(),
      payload: fac.rows[0],
    });
    res.status(201).json(fac.rows[0]);
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error('Error creating factura:', e);
    try { console.error('Request body at error:', JSON.stringify(req.body).slice(0, 2000)); } catch {}
    res.status(500).json({ error: e?.message || 'Error' });
  } finally { client.release(); }
});

router.put('/:id', async (req, res) => {
  try {
    const { estado, notas } = req.body;
    const r = await pool.query(
      `UPDATE facturas SET
        estado = COALESCE($1,estado),
        notas = COALESCE($2,notas),
        pago_autorizado_at = CASE
          WHEN $1 = 'pagada' THEN COALESCE(pago_autorizado_at, CURRENT_TIMESTAMP)
          ELSE pago_autorizado_at
        END
       WHERE id=$3 RETURNING *`,
      [estado, notas, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrada' });
    emitRealtime({
      type: 'sync',
      entity: 'facturas',
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
    const r = await pool.query('DELETE FROM facturas WHERE id=$1 RETURNING id,numero', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrada' });
    emitRealtime({
      type: 'sync',
      entity: 'facturas',
      action: 'delete',
      id: req.params.id,
      timestamp: new Date().toISOString(),
      payload: r.rows[0],
    });
    res.json({ message: 'Eliminada', ...r.rows[0] });
  } catch { res.status(500).json({ error: 'Error' }); }
});

export default router;
