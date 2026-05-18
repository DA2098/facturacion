// DASHBOARD — Estadísticas
//
// Endpoint para obtener métricas resumidas usadas en el dashboard.
// Devuelve totales de usuarios, productos, facturas y montos agregados.
import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/stats', async (_req, res) => {
  try {
    const usuarios = await pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE rol='cliente') AS clientes FROM usuarios");
    const productos = await pool.query('SELECT COUNT(*) AS total FROM productos');
    const resumen = await pool.query('SELECT * FROM v_resumen_facturacion');
    const r = resumen.rows[0];
    res.json({
      totalUsuarios: parseInt(usuarios.rows[0].total),
      totalClientes: parseInt(usuarios.rows[0].clientes),
      totalProductos: parseInt(productos.rows[0].total),
      totalFacturas: parseInt(r.total_facturas),
      montoTotal: parseFloat(r.monto_total),
      impuestoTotal: parseFloat(r.impuesto_total),
      emitidas: parseInt(r.emitidas),
      pagadas: parseInt(r.pagadas),
      anuladas: parseInt(r.anuladas),
      pendientes: parseInt(r.pendientes),
    });
  } catch { res.status(500).json({ error: 'Error' }); }
});

router.get('/ganancias-periodo', async (_req, res) => {
  try {
    // Ganancias por período: PAGADAS (verde), ANULADAS (rojo), PENDIENTES (amarillo)
    const hoy = new Date().toISOString().split('T')[0];
    const hace7dias = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
    const hace30dias = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
    const hace365dias = new Date(Date.now() - 365*24*60*60*1000).toISOString().split('T')[0];

    // Datos para hoy
    const dia = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN estado='pagada' THEN total ELSE 0 END), 0) AS ganancia,
        COALESCE(SUM(CASE WHEN estado='anulada' THEN total ELSE 0 END), 0) AS perdida,
        COALESCE(SUM(CASE WHEN estado='pendiente' THEN total ELSE 0 END), 0) AS advertencia
       FROM facturas WHERE fecha = $1`,
      [hoy]
    );

    // Datos para semana
    const semana = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN estado='pagada' THEN total ELSE 0 END), 0) AS ganancia,
        COALESCE(SUM(CASE WHEN estado='anulada' THEN total ELSE 0 END), 0) AS perdida,
        COALESCE(SUM(CASE WHEN estado='pendiente' THEN total ELSE 0 END), 0) AS advertencia
       FROM facturas WHERE fecha >= $1 AND fecha <= $2`,
      [hace7dias, hoy]
    );

    // Datos para mes
    const mes = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN estado='pagada' THEN total ELSE 0 END), 0) AS ganancia,
        COALESCE(SUM(CASE WHEN estado='anulada' THEN total ELSE 0 END), 0) AS perdida,
        COALESCE(SUM(CASE WHEN estado='pendiente' THEN total ELSE 0 END), 0) AS advertencia
       FROM facturas WHERE fecha >= $1 AND fecha <= $2`,
      [hace30dias, hoy]
    );

    // Datos para año
    const anio = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN estado='pagada' THEN total ELSE 0 END), 0) AS ganancia,
        COALESCE(SUM(CASE WHEN estado='anulada' THEN total ELSE 0 END), 0) AS perdida,
        COALESCE(SUM(CASE WHEN estado='pendiente' THEN total ELSE 0 END), 0) AS advertencia
       FROM facturas WHERE fecha >= $1 AND fecha <= $2`,
      [hace365dias, hoy]
    );

    const formatPeriodo = (row: any) => ({
      ganancia: parseFloat(row.ganancia) || 0,
      perdida: parseFloat(row.perdida) || 0,
      advertencia: parseFloat(row.advertencia) || 0,
    });

    res.json({
      dia: { periodo: 'Hoy', ...formatPeriodo(dia.rows[0]) },
      semana: { periodo: 'Semana', ...formatPeriodo(semana.rows[0]) },
      mes: { periodo: 'Mes', ...formatPeriodo(mes.rows[0]) },
      anio: { periodo: 'Año', ...formatPeriodo(anio.rows[0]) },
    });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

export default router;
