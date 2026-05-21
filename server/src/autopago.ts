import pool from './db';
import { emitRealtime } from './realtime';

export type AutopagoConfig = {
  activo: boolean;
  minutos: number;
  updated_at: string;
};

function mapConfig(row: any): AutopagoConfig {
  return {
    activo: Boolean(row.activo),
    minutos: Number(row.minutos || 0),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export async function getAutopagoConfig(): Promise<AutopagoConfig> {
  const r = await pool.query('SELECT activo, minutos, updated_at FROM config_autopago WHERE id = 1');
  if (r.rows.length) return mapConfig(r.rows[0]);
  const inserted = await pool.query(
    'INSERT INTO config_autopago (id, activo, minutos) VALUES (1, TRUE, 10) RETURNING activo, minutos, updated_at'
  );
  return mapConfig(inserted.rows[0]);
}

export async function updateAutopagoConfig(data: { activo: boolean; minutos: number }): Promise<AutopagoConfig> {
  const r = await pool.query(
    `UPDATE config_autopago
     SET activo = $1,
         minutos = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = 1
     RETURNING activo, minutos, updated_at`,
    [data.activo, data.minutos]
  );
  if (r.rows.length) return mapConfig(r.rows[0]);
  const inserted = await pool.query(
    `INSERT INTO config_autopago (id, activo, minutos)
     VALUES (1, $1, $2)
     RETURNING activo, minutos, updated_at`,
    [data.activo, data.minutos]
  );
  return mapConfig(inserted.rows[0]);
}

export async function scheduleFacturaAutopago(facturaId: string, minutos: number) {
  if (!minutos || minutos <= 0) return null;
  const r = await pool.query(
    `UPDATE facturas
     SET estado = 'pendiente',
         pago_programado_para = CURRENT_TIMESTAMP + ($1 || ' minutes')::interval,
         pago_autorizado_at = NULL
     WHERE id = $2
     RETURNING *`,
    [minutos, facturaId]
  );
  return r.rows[0] || null;
}

export async function sweepAutopagoFacturas() {
  const r = await pool.query(
    `UPDATE facturas
     SET estado = 'pagada',
         pago_autorizado_at = COALESCE(pago_autorizado_at, CURRENT_TIMESTAMP)
     WHERE estado = 'pendiente'
       AND pago_programado_para IS NOT NULL
       AND pago_programado_para <= CURRENT_TIMESTAMP
     RETURNING *`
  );

  for (const row of r.rows) {
    emitRealtime({
      type: 'sync',
      entity: 'facturas',
      action: 'update',
      id: row.id,
      timestamp: new Date().toISOString(),
      payload: row,
    });
  }

  return r.rows;
}
