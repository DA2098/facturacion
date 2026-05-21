// Lógica de notificaciones centralizada
// Permite crear notificaciones para cualquier usuario y evento
import pool from '../db';

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
  await pool.query(
    `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, data)
     VALUES ($1, $2, $3, $4, $5)`,
    [usuario_id, tipo, titulo, mensaje, data || {}]
  );
}
