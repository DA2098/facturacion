import { useEffect, useState } from 'react';
import { Clock3, Settings2, ShieldCheck, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { getAutopagoConfig, updateAutopagoConfig } from '../services/db.ts';
import type { AutopagoConfig } from '../types/index.ts';

const defaultConfig: AutopagoConfig = {
  activo: true,
  minutos: 10,
  updated_at: new Date().toISOString(),
};

export default function AutoPagoPanel() {
  const { user } = useAuth();
  const [config, setConfig] = useState<AutopagoConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [unit, setUnit] = useState<'minutes'|'hours'|'days'|'weeks'|'months'|'sixmonths'|'years'>('minutes');
  const [value, setValue] = useState<number>(10);

  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await getAutopagoConfig();
        setConfig(cfg);
      } catch {
        setMsg('No se pudo cargar la configuración de auto-pago.');
      }
    };
    void load();
  }, []);

  useEffect(() => {
    // derive value/unit from config.minutos
    const m = Number(config.minutos || 0);
    if (!m) { setUnit('minutes'); setValue(0); return; }
    if (m === 5) { setUnit('minutes'); setValue(5); return; }
    if (m === 60) { setUnit('hours'); setValue(1); return; }
    if (m === 1440) { setUnit('days'); setValue(1); return; }
    if (m === 10080) { setUnit('weeks'); setValue(1); return; }
    if (m === 43200) { setUnit('months'); setValue(1); return; }
    if (m === 259200) { setUnit('sixmonths'); setValue(6); return; }
    if (m === 525600) { setUnit('years'); setValue(1); return; }

    if (m % 525600 === 0) { setUnit('years'); setValue(m / 525600); }
    else if (m % 259200 === 0) { setUnit('sixmonths'); setValue(m / 43200); }
    else if (m % 43200 === 0) { setUnit('months'); setValue(m / 43200); }
    else if (m % 10080 === 0) { setUnit('weeks'); setValue(m / 10080); }
    else if (m % 1440 === 0) { setUnit('days'); setValue(m / 1440); }
    else if (m % 60 === 0) { setUnit('hours'); setValue(m / 60); }
    else { setUnit('minutes'); setValue(m); }
  }, [config.minutos]);

  if (!user) return null;
  const isAdmin = user.rol === 'admin';

  function displayUnitShort(u: string) {
    return u === 'minutes' ? 'min' : u === 'hours' ? 'h' : u === 'days' ? 'd' : u === 'weeks' ? 'w' : u === 'months' ? 'm' : u === 'sixmonths' ? '6m' : 'y';
  }

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const map: Record<string, number> = { minutes: 1, hours: 60, days: 1440, weeks: 10080, months: 43200, sixmonths: 259200, years: 525600 };
      let minutos = Math.max(0, Math.round(value * (map[unit] || 1)));
      const updated = await updateAutopagoConfig({ activo: config.activo, minutos });
      if (!updated) { setMsg('No se pudo guardar la configuración.'); return; }
      setConfig(updated);
      setMsg('Configuración guardada correctamente.');
    } catch (e) {
      console.error(e);
      setMsg('Error guardando configuración');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dash-box">
      <div className="box-top-row">
        <h2 className="box-title"><Settings2 size={18} /> Auto-pago de facturas</h2>
        <ShieldCheck size={18} />
      </div>

      <p className="page-sub" style={{ marginBottom: 12 }}>
        Las compras de tienda quedan como <strong>pendientes</strong> y pasan a <strong>pagadas</strong> cuando vence el tiempo configurado.
      </p>

      <div className="form-row">
        <div className="form-col">
          <label className="form-label">Activo</label>
          <button
            type="button"
            onClick={() => setConfig(c => ({ ...c, activo: !c.activo }))}
            className={`btn btn-sm ${config.activo ? 'btn-success' : 'btn-ghost'}`}
            disabled={!isAdmin || saving}
          >
            {config.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />} {config.activo ? 'Activado' : 'Desactivado'}
          </button>
        </div>

        <div className="form-col">
          <label className="form-label">Tiempo de espera</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" min={0} value={value} onChange={e => setValue(Math.max(0, Number(e.target.value || 0)))} className="form-input" disabled={!isAdmin || saving} />
            <select value={unit} onChange={e => setUnit(e.target.value as any)} className="form-input" disabled={!isAdmin || saving}>
              <option value="minutes">Minutos</option>
              <option value="hours">Horas</option>
              <option value="days">Días</option>
              <option value="weeks">Semanas</option>
              <option value="months">Meses</option>
              <option value="sixmonths">6 Meses</option>
              <option value="years">Años</option>
            </select>
          </div>
        </div>
      </div>

      <div className="box-extra" style={{ marginTop: 12 }}>
        <p className="box-extra-label"><Clock3 size={14} /> Tiempo actual</p>
        <p className="box-extra-value">{config.activo ? `${config.minutos} min` : 'Suspendido'}</p>

        <div style={{ marginTop: 8 }}>
          <small>Presets:</small>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button type="button" className="btn btn-sm" onClick={() => { setUnit('minutes'); setValue(5); }} disabled={!isAdmin || saving}>5m</button>
            <button type="button" className="btn btn-sm" onClick={() => { setUnit('hours'); setValue(1); }} disabled={!isAdmin || saving}>1h</button>
            <button type="button" className="btn btn-sm" onClick={() => { setUnit('days'); setValue(1); }} disabled={!isAdmin || saving}>1d</button>
            <button type="button" className="btn btn-sm" onClick={() => { setUnit('weeks'); setValue(1); }} disabled={!isAdmin || saving}>1w</button>
            <button type="button" className="btn btn-sm" onClick={() => { setUnit('months'); setValue(1); }} disabled={!isAdmin || saving}>1m</button>
            <button type="button" className="btn btn-sm" onClick={() => { setUnit('sixmonths'); setValue(6); }} disabled={!isAdmin || saving}>6m</button>
            <button type="button" className="btn btn-sm" onClick={() => { setUnit('years'); setValue(1); }} disabled={!isAdmin || saving}>1y</button>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="fac-actions" style={{ marginTop: 16 }}>
          <button onClick={() => void save()} disabled={saving} className="btn btn-primary">
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      ) : (
        <p className="form-help" style={{ marginTop: 16 }}>
          Solo el administrador puede cambiar esta configuración.
        </p>
      )}

      {msg && (
        <p className="profile-msg" style={{ marginTop: 12 }}>
          <CheckCircle2 size={14} /> {msg}
        </p>
      )}
    </div>
  );
}
