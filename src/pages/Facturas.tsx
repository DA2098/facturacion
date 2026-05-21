// ═══════════════════════════════════════════════════════════════
// FACTURAS — Listado y gestión de facturas (Admin, Vendedor, Contador)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, FileText, CheckCircle, XCircle, Printer } from 'lucide-react';
import { getFacturas, updateFactura, deleteFactura, getFacturasByVendedor, getFacturaById, extendFacturaTiempo } from '../services/db.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh.ts';
import type { Factura } from '../types/index.ts';
import Modal from '../components/Modal.tsx';
import Confirm from '../components/Confirm.tsx';
import { formatAutopagoCountdown } from '../utils/autopago.ts';

export default function Facturas() {
  const { user } = useAuth();
  const [all, setAll] = useState<Factura[]>([]);
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewF, setViewF] = useState<Factura | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [delId, setDelId] = useState('');
  const [now, setNow] = useState(Date.now());
  // Nota: la configuración global de autopago ahora se maneja desde el Dashboard.

  async function load() {
    if (!user) return;
    if (user.rol === 'vendedor') { setAll(await getFacturasByVendedor(user.id)); }
    else { setAll(await getFacturas()); }
  }
  useEffect(() => { void load(); }, [user]);
  useEffect(() => {
    // If admin or vendedor we need a smooth realtime countdown (1s), otherwise coarse refresh
    const intervalMs = user && (user.rol === 'admin' || user.rol === 'vendedor') ? 1000 : 30000;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [user]);
  useRealtimeRefresh(() => { void load(); }, Boolean(user));

  function getAutopagoLabel(f: Factura) {
    if (f.estado !== 'pendiente' || f.canal_venta !== 'tienda' || !f.pago_programado_para) return '';
    const remaining = new Date(f.pago_programado_para).getTime() - now;
    return remaining > 0
      ? `Auto-pago en ${formatAutopagoCountdown(f.pago_programado_para)}`
      : 'Auto-pago en proceso';
  }

  const filtered = all.filter(f => {
    if (filtro !== 'todos' && f.estado !== filtro) return false;
    if (q) {
      const s = q.toLowerCase();
      return f.numero.toLowerCase().includes(s) || f.cliente_nombre.toLowerCase().includes(s);
    }
    return true;
  }).reverse();

  async function verDetalle(f: Factura) {
    const full = await getFacturaById(f.id);
    setViewF(full || f);
    setViewOpen(true);
  }
  // La gestión global de autopago se realiza en `Dashboard`.
  async function marcar(id: string, estado: 'pagada' | 'anulada') {
    await updateFactura(id, { estado });
    await load();
    if (viewF?.id === id) setViewF({ ...viewF!, estado });
  }

  const isReadOnly = user?.rol === 'contador';

  return (
    <div className="page">
      <div className="page-top">
        <div><h1 className="page-title">Facturas</h1><p className="page-sub">Gestión de facturas electrónicas</p></div>
      </div>

      <div className="filters">
        <div className="search-wrap"><Search size={16} className="search-ic" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por N° o cliente..." className="search-input" /></div>
        <div className="filter-tabs">
          {['todos', 'emitida', 'pagada', 'anulada', 'pendiente'].map(e => (
            <button key={e} onClick={() => setFiltro(e)} className={`ftab ${filtro === e ? 'ftab-on' : ''}`}>
              {e === 'todos' ? 'Todas' : e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
        {/* La configuración global de autopago se muestra en Dashboard. */}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><FileText size={44} className="empty-icon" /><h3>No hay facturas</h3></div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>N° Factura</th><th>Cliente</th><th>Vendedor</th><th>Fecha</th><th>Subtotal</th><th>Imp.</th><th>Total</th><th>Método</th><th>Estado</th><th>Auto-pago</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td className="mono fw-600">{f.numero}</td>
                  <td>{f.cliente_nombre}<br/><span className="td-desc">RUC: {f.cliente_ruc}</span></td>
                  <td>{f.vendedor_nombre}</td>
                  <td>{f.fecha}</td>
                  <td>USD {f.subtotal.toFixed(2)}</td>
                  <td>USD {f.impuesto_total.toFixed(2)}</td>
                  <td className="fw-600">USD {f.total.toFixed(2)}</td>
                  <td><span className="badge badge-cat">{f.metodo_pago}</span></td>
                  <td><span className={`badge badge-${f.estado}`}>{f.estado}</span></td>
                  <td className="td-desc">{getAutopagoLabel(f)}</td>
                  <td>
                    <div className="act-btns">
                      <button onClick={() => void verDetalle(f)} className="act-btn act-view"><Eye size={14} /></button>
                      {/* Mostrar al cliente como pagada: disponible a admin y vendedor */}
                      {(user?.rol === 'admin' || user?.rol === 'vendedor') && f.estado !== 'pagada' && (
                        <button onClick={() => void marcar(f.id, 'pagada')} className="act-btn act-ok" title="Mostrar al cliente como pagada"><CheckCircle size={14} /></button>
                      )}
                      {!isReadOnly && f.estado === 'emitida' && <button onClick={() => void marcar(f.id, 'pagada')} className="act-btn act-ok"><CheckCircle size={14} /></button>}
                      {!isReadOnly && f.estado !== 'anulada' && <button onClick={() => void marcar(f.id, 'anulada')} className="act-btn act-warn"><XCircle size={14} /></button>}
                      {user?.rol === 'admin' && <button onClick={() => { setDelId(f.id); setConfirmOpen(true); }} className="act-btn act-del"><Trash2 size={14} /></button>}
                      {(f.estado === 'pendiente' && f.canal_venta === 'tienda' && (user?.rol === 'admin' || user?.rol === 'vendedor')) && (
                        <button onClick={async () => {
                          const minsStr = prompt('Minutos a añadir al pago programado (ej: 60):', '60');
                          if (!minsStr) return;
                          const mins = Number(minsStr);
                          if (!Number.isFinite(mins) || mins <= 0) { alert('Valor inválido'); return; }
                          const updated = await extendFacturaTiempo(f.id, mins);
                          if (updated) { alert('Tiempo ampliado'); await load(); } else alert('Error ampliando tiempo');
                        }} className="act-btn act-primary" title="Ampliar tiempo">+</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalle */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Detalle de Factura" wide>
        {viewF && (
          <div className="fac-detail">
            <div className="fac-head">
              <div><h3 className="fac-num">{viewF.numero}</h3><p className="fac-date">Fecha: {viewF.fecha}</p></div>
              <span className={`badge badge-lg badge-${viewF.estado}`}>{viewF.estado.toUpperCase()}</span>
            </div>
            <div className="fac-info-grid">
              <div className="fac-info-box"><p className="fac-info-label">Cliente</p><p className="fac-info-val">{viewF.cliente_nombre}</p><p className="fac-info-sub">RUC: {viewF.cliente_ruc}</p></div>
              <div className="fac-info-box"><p className="fac-info-label">Vendedor</p><p className="fac-info-val">{viewF.vendedor_nombre}</p><p className="fac-info-sub">Método: {viewF.metodo_pago}</p></div>
            </div>
            <div className="tbl-wrap-sm">
              <table className="tbl-sm">
                <thead><tr><th>Código</th><th>Producto</th><th>Cant</th><th>P.Unit</th><th>Imp%</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {viewF.detalles.map(d => (
                    <tr key={d.id}><td className="mono">{d.producto_codigo}</td><td>{d.producto_nombre}</td><td>{d.cantidad}</td><td>USD {d.precio_unitario.toFixed(2)}</td><td>{d.impuesto}%</td><td>USD {d.subtotal.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="fac-totales">
              <div className="fac-total-row"><span>Subtotal:</span><span>USD {viewF.subtotal.toFixed(2)}</span></div>
              <div className="fac-total-row"><span>Impuesto:</span><span>USD {viewF.impuesto_total.toFixed(2)}</span></div>
              <div className="fac-total-row fac-total-big"><span>TOTAL:</span><span>USD {viewF.total.toFixed(2)}</span></div>
            </div>
            {viewF.notas && <div className="fac-notas"><p className="fac-info-label">Notas:</p><p>{viewF.notas}</p></div>}
            <div className="fac-actions">
              {!isReadOnly && viewF.estado === 'emitida' && <button onClick={() => marcar(viewF.id, 'pagada')} className="btn btn-success"><CheckCircle size={14} /> Marcar Pagada</button>}
              {!isReadOnly && viewF.estado !== 'anulada' && <button onClick={() => marcar(viewF.id, 'anulada')} className="btn btn-warning"><XCircle size={14} /> Anular</button>}
              <button onClick={() => printFactura(viewF)} className="btn btn-ghost"><Printer size={14} /> Imprimir</button>
            </div>
          </div>
        )}
      </Modal>

      <Confirm open={confirmOpen} msg="¿Eliminar esta factura?" onYes={() => { void deleteFactura(delId).then(() => load()); setConfirmOpen(false); }} onNo={() => setConfirmOpen(false)} />
    </div>
  );
}
