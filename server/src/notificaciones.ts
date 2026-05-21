// Lógica de notificaciones centralizada
// Permite crear notificaciones para cualquier usuario y evento
import pool from './db';
import { emitRealtime } from './realtime';

export type NotificacionTipo =
  | 'producto_agregado'
  | 'factura_emitida'
  | 'factura_pagada';

export interface CrearNotificacionParams {
  usuario_id: string;
  tipo: NotificacionTipo;
  titulo: string;
  mensaje: string;
  data?: any;
}

export async function crearNotificacion({ usuario_id, tipo, titulo, mensaje, data }: CrearNotificacionParams) {
  const r = await pool.query(
    `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, data)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [usuario_id, tipo, titulo, mensaje, data || {}]
  );
  const row = r.rows[0];
  // Emitir evento realtime para que el cliente reciba la notificación en tiempo real
  try {
    emitRealtime({
      type: 'sync',
      entity: 'notificaciones',
      action: 'create',
      id: row.id,
      timestamp: new Date().toISOString(),
      payload: row,
    });
  } catch (e) {
    // no bloquear por errores de realtime
    console.error('Error emitting realtime notification', e);
  }
  return row;
}
