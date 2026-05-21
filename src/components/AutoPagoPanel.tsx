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

  useEffect(() => {
    const load = async () => {
      try {
        setConfig(await getAutopagoConfig());
      } catch {
        setMsg('No se pudo cargar la configuración de auto-pago.');
      }
    };
    void load();
  }, []);

  if (!user) return null;

  const isAdmin = user.rol === 'admin';

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const updated = await updateAutopagoConfig({ activo: config.activo, minutos: config.minutos });
      if (!updated) {
        setMsg('No se pudo guardar la configuración.');
        return;
      }
      setConfig(updated);
      setMsg('Configuración guardada correctamente.');
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
          <label className="form-label">Minutos de espera</label>
          <input
            type="number"
            min="0"
            value={config.minutos}
            onChange={e => setConfig(c => ({ ...c, minutos: Math.max(0, Number(e.target.value) || 0) }))}
            className="form-input"
            disabled={!isAdmin || saving}
          />
        </div>
      </div>

      <div className="box-extra" style={{ marginTop: 12 }}>
        <p className="box-extra-label"><Clock3 size={14} /> Tiempo actual</p>
        <p className="box-extra-value">{config.activo ? `${config.minutos} min` : 'Suspendido'}</p>
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
