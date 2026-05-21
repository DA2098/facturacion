// ═══════════════════════════════════════════════════════════════
// DASHBOARD — Panel principal según rol
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications.ts';
import { getStats, getFacturas } from '../services/db.ts';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh.ts';
import { FileText, Users, Package, DollarSign, TrendingUp, Clock, XCircle, AlertCircle } from 'lucide-react';
import ProfilePanel from '../components/ProfilePanel.tsx';
import AutoPagoPanel from '../components/AutoPagoPanel.tsx';
import type { Factura } from '../types/index.ts';

const emptyStats = {
  totalUsuarios: 0,
  totalClientes: 0,
  totalProductos: 0,
  totalFacturas: 0,
  montoTotal: 0,
  impuestoTotal: 0,
  emitidas: 0,
  pagadas: 0,
  anuladas: 0,
  pendientes: 0,
};

function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(emptyStats);
  const [recientes, setRecientes] = useState<Factura[]>([]);
  useRealtimeNotifications();

  useEffect(() => {
    const load = async () => {
      setStats(await getStats());
      const all = await getFacturas();
      setRecientes(all.slice(-6).reverse());
    };
    void load();
  }, []);
  useRealtimeRefresh(() => {
    const load = async () => {
      setStats(await getStats());
      const all = await getFacturas();
      setRecientes(all.slice(-6).reverse());
    };
    void load();
  }, Boolean(user));
  if (!user) return null;
  const cards = [
    { label: 'Facturas', val: stats.totalFacturas, icon: FileText, cls: 'card-blue' },
    { label: 'Clientes', val: stats.totalClientes, icon: Users, cls: 'card-green' },
    { label: 'Productos', val: stats.totalProductos, icon: Package, cls: 'card-purple' },
    { label: 'Ingresos', val: `USD/ ${stats.montoTotal.toFixed(2)}`, icon: DollarSign, cls: 'card-orange' },
  ];
  const estados = [
    { label: 'Emitidas', val: stats.emitidas, icon: Clock, cls: 'fill-blue' },
    { label: 'Pagadas', val: stats.pagadas, icon: TrendingUp, cls: 'fill-green' },
    { label: 'Anuladas', val: stats.anuladas, icon: XCircle, cls: 'fill-red' },
    { label: 'Pendientes', val: stats.pendientes, icon: AlertCircle, cls: 'fill-yellow' },
  ];
  const maxE = Math.max(...estados.map(e => e.val), 1);
  return (
    <div className="page">
      <div className="page-top">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Bienvenido, {user.nombre} — {user.rol === 'admin' ? 'Panel Administrador' : user.rol === 'vendedor' ? 'Panel Vendedor' : 'Panel Contador'}</p>
        </div>
      </div>
      <ProfilePanel title="Tu perfil" subtitle="Edita tu nombre, foto, contraseña y datos básicos desde aquí." />
      <AutoPagoPanel />
      <div className="stats-grid">
        {cards.map(c => (
          <div key={c.label} className={`stat-card ${c.cls}`}>
            <div>
              <p className="stat-label">{c.label}</p>
              <p className="stat-value">{c.val}</p>
            </div>
            <div className="stat-icon"><c.icon size={26} /></div>
          </div>
        ))}
      </div>
      <div className="dash-row">
        <div className="dash-box">
          <h2 className="box-title">Estado de Facturas</h2>
          <div className="bars">
            {estados.map(e => (
              <div key={e.label} className="bar-row">
                <div className="bar-label">
                  <e.icon size={14} />
                  <span>{e.label}</span>
                  <span className="bar-count">{e.val}</span>
                </div>
                <div className="bar-track">
                  <div className={`bar-fill ${e.cls}`} style={{ width: `${(e.val / maxE) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          {user.rol === 'admin' && (
            <div className="box-extra">
              <p className="box-extra-label">Impuesto recaudado</p>
              <p className="box-extra-value">USD/ {stats.impuestoTotal.toFixed(2)}</p>
            </div>
          )}
        </div>
        <div className="dash-box">
          <div className="box-top-row">
            <h2 className="box-title">Últimas Facturas</h2>
            <button onClick={() => nav('/facturas')} className="btn btn-sm btn-ghost">Ver todas</button>
          </div>
          {recientes.length === 0 ? (
            <div className="empty-sm">
              <FileText size={28} className="empty-icon" />
              <p>No hay facturas aún</p>
            </div>
          ) : (
            <div className="tbl-wrap-sm">
              <table className="tbl-sm">
                <thead>
                  <tr><th>N°</th><th>Cliente</th><th>Total</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {recientes.map(f => (
                    <tr key={f.id}>
                      <td className="mono">{f.numero}</td>
                      <td>{f.cliente_nombre}</td>
                      <td>USD {f.total.toFixed(2)}</td>
                      <td><span className={`badge badge-${f.estado}`}>{f.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
