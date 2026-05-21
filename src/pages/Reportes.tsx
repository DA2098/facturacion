// ═══════════════════════════════════════════════════════════════
// REPORTES — Vista de reportes (Admin y Contador)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { getStats, getFacturas, getUsuariosByRol } from '../services/db.ts';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh.ts';
import { BarChart3, DollarSign, TrendingUp, FileText, Users } from 'lucide-react';
import GraficosGanancias from '../components/GraficosGanancias.tsx';
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

export default function Reportes() {
  const [stats, setStats] = useState(emptyStats);
  const [facturas, setFacturas] = useState<Factura[]>([]);

  useEffect(() => {
    const load = async () => {
      setStats(await getStats());
      setFacturas(await getFacturas());
    };
    void load();
  }, []);

  useRealtimeRefresh(() => {
    const load = async () => {
      setStats(await getStats());
      setFacturas(await getFacturas());
    };
    void load();
  }, true);

  // agrupar ventas por vendedor
  const porVendedor: Record<string, { nombre: string; total: number; count: number }> = {};
  facturas.forEach(f => {
    if (!porVendedor[f.vendedor_id]) porVendedor[f.vendedor_id] = { nombre: f.vendedor_nombre, total: 0, count: 0 };
    porVendedor[f.vendedor_id].total += f.total;
    porVendedor[f.vendedor_id].count++;
  });

  // agrupar por método de pago
  const porMetodo: Record<string, { total: number; count: number }> = {};
  facturas.forEach(f => {
    if (!porMetodo[f.metodo_pago]) porMetodo[f.metodo_pago] = { total: 0, count: 0 };
    porMetodo[f.metodo_pago].total += f.total;
    porMetodo[f.metodo_pago].count++;
  });

  // top clientes
  const porCliente: Record<string, { nombre: string; total: number; count: number }> = {};
  facturas.forEach(f => {
    if (!porCliente[f.cliente_id]) porCliente[f.cliente_id] = { nombre: f.cliente_nombre, total: 0, count: 0 };
    porCliente[f.cliente_id].total += f.total;
    porCliente[f.cliente_id].count++;
  });
  const topClientes = Object.values(porCliente).sort((a, b) => b.total - a.total).slice(0, 5);

  const [totalClientes, setTotalClientes] = useState(0);

  useEffect(() => {
    const loadClientes = async () => {
      setTotalClientes((await getUsuariosByRol('cliente')).length);
    };
    void loadClientes();
  }, []);

  useRealtimeRefresh(() => {
    const loadClientes = async () => {
      setTotalClientes((await getUsuariosByRol('cliente')).length);
    };
    void loadClientes();
  }, true);

  return (
    <div className="page">
      <div className="page-top">
        <div><h1 className="page-title">Reportes</h1><p className="page-sub">Análisis financiero y de ventas</p></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card card-blue"><div><p className="stat-label">Ingresos Totales</p><p className="stat-value">USD {stats.montoTotal.toFixed(2)}</p></div><div className="stat-icon"><DollarSign size={26} /></div></div>
        <div className="stat-card card-green"><div><p className="stat-label">Impuestos</p><p className="stat-value">USD {stats.impuestoTotal.toFixed(2)}</p></div><div className="stat-icon"><TrendingUp size={26} /></div></div>
        <div className="stat-card card-purple"><div><p className="stat-label">Facturas</p><p className="stat-value">{stats.totalFacturas}</p></div><div className="stat-icon"><FileText size={26} /></div></div>
        <div className="stat-card card-orange"><div><p className="stat-label">Clientes</p><p className="stat-value">{totalClientes}</p></div><div className="stat-icon"><Users size={26} /></div></div>
      </div>

      <GraficosGanancias />

      <div className="dash-row">
        {/* Ventas por vendedor */}
        <div className="dash-box">
          <h2 className="box-title"><BarChart3 size={16} /> Ventas por Vendedor</h2>
          {Object.keys(porVendedor).length === 0 ? (
            <p className="empty-text">Sin datos</p>
          ) : (
            <div className="tbl-wrap-sm">
              <table className="tbl-sm">
                <thead><tr><th>Vendedor</th><th>Facturas</th><th>Total</th></tr></thead>
                <tbody>
                  {Object.values(porVendedor).map((v, i) => (
                    <tr key={i}><td className="fw-600">{v.nombre}</td><td>{v.count}</td><td>USD {v.total.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top clientes */}
        <div className="dash-box">
          <h2 className="box-title"><Users size={16} /> Top 5 Clientes</h2>
          {topClientes.length === 0 ? (
            <p className="empty-text">Sin datos</p>
          ) : (
            <div className="tbl-wrap-sm">
              <table className="tbl-sm">
                <thead><tr><th>Cliente</th><th>Compras</th><th>Total</th></tr></thead>
                <tbody>
                  {topClientes.map((c, i) => (
                    <tr key={i}><td className="fw-600">{c.nombre}</td><td>{c.count}</td><td>USD {c.total.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="dash-row">
        {/* Por método de pago */}
        <div className="dash-box">
          <h2 className="box-title"><DollarSign size={16} /> Por Método de Pago</h2>
          {Object.keys(porMetodo).length === 0 ? (
            <p className="empty-text">Sin datos</p>
          ) : (
            <div className="metodo-grid">
              {Object.entries(porMetodo).map(([m, d]) => (
                  <div key={m} className="metodo-card">
                  <p className="metodo-name">{m}</p>
                  <p className="metodo-total">USD {d.total.toFixed(2)}</p>
                  <p className="metodo-count">{d.count} factura{d.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estado de facturas */}
        <div className="dash-box">
          <h2 className="box-title"><FileText size={16} /> Estado de Facturas</h2>
          <div className="estado-summary">
            <div className="estado-item"><span className="badge badge-emitida">Emitidas</span><span className="estado-num">{stats.emitidas}</span></div>
            <div className="estado-item"><span className="badge badge-pagada">Pagadas</span><span className="estado-num">{stats.pagadas}</span></div>
            <div className="estado-item"><span className="badge badge-anulada">Anuladas</span><span className="estado-num">{stats.anuladas}</span></div>
            <div className="estado-item"><span className="badge badge-pendiente">Pendientes</span><span className="estado-num">{stats.pendientes}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
