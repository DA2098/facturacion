export default MisFacturas;
// ═══════════════════════════════════════════════════════════════
// MIS FACTURAS — Vista del cliente para ver sus facturas
// ═══════════════════════════════════════════════════════════════


import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications.ts';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh.ts';
import { getFacturasByCliente, getFacturaById } from '../services/db.ts';
import type { Factura } from '../types/index.ts';
import Modal from '../components/Modal.tsx';
import { Eye, FileText, Printer, Download } from 'lucide-react';
import ProfilePanel from '../components/ProfilePanel.tsx';
import { formatAutopagoCountdown } from '../utils/autopago.ts';
import printFactura from '../utils/printFactura.ts';

function MisFacturas() {

  const { user } = useAuth();
  useRealtimeNotifications();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewF, setViewF] = useState<Factura | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const load = async () => {
      if (user) setFacturas((await getFacturasByCliente(user.id)).reverse());
    };
    void load();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useRealtimeRefresh(() => {
    const load = async () => {
      if (user) setFacturas((await getFacturasByCliente(user.id)).reverse());
    };
    void load();
  }, Boolean(user));

  async function openFactura(id: string) {
    const fac = await getFacturaById(id);
    if (fac) {
      setViewF(fac);
      setViewOpen(true);
    }
  }

  function getAutopagoLabel(f: Factura) {
    // Clientes no deben ver el contador
    if (user?.rol === 'cliente') return '';
    if (f.estado !== 'pendiente' || f.canal_venta !== 'tienda' || !f.pago_programado_para) return '';
    const remaining = new Date(f.pago_programado_para).getTime() - now;
    return remaining > 0
      ? `Auto-pago en ${formatAutopagoCountdown(f.pago_programado_para)}`
      : 'Auto-pago en proceso';
  }

  return (
    <div className="page">
      <div className="page-top">
        <div><h1 className="page-title">Mis Facturas</h1><p className="page-sub">Historial de compras y facturas emitidas</p></div>
      </div>

      <ProfilePanel title="Mi perfil" subtitle="Cambia tu foto y actualiza tu información personal." />

      {facturas.length === 0 ? (
        <div className="empty-state">
          <FileText size={44} className="empty-icon" />
          <h3>No tienes facturas aún</h3>
          <p className="empty-text">Realiza tu primera compra en la tienda</p>
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Fecha</th>
                <th>Ítems</th>
                <th>Subtotal</th>
                <th>Impuesto</th>
                <th>Total</th>
                <th>Método</th>
                <th>Estado</th>
                {user?.rol !== 'cliente' && <th>Auto-pago</th>}
                <th>Ver</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map(f => (
                <tr key={f.id}>
                  <td className="mono fw-600">{f.numero}</td>
                  <td>{f.fecha}</td>
                  <td>{f.detalles.length}</td>
                  <td>USD {f.subtotal.toFixed(2)}</td>
                  <td>USD {f.impuesto_total.toFixed(2)}</td>
                  <td className="fw-600">USD {f.total.toFixed(2)}</td>
                  <td><span className="badge badge-cat">{f.metodo_pago}</span></td>
                  <td><span className={`badge badge-${f.estado}`}>{f.estado}</span></td>
                  {user?.rol !== 'cliente' && <td className="td-desc">{getAutopagoLabel(f)}</td>}
                  <td><button onClick={() => void openFactura(f.id)} className="act-btn act-view"><Eye size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Mi Factura" wide>
        {viewF && (
          <div className="fac-detail">
            <div className="fac-head">
              <div>
                <h3 className="fac-num">{viewF.numero}</h3>
                <p className="fac-date">Fecha: {viewF.fecha}</p>
              </div>
              <span className={`badge badge-lg badge-${viewF.estado}`}>{viewF.estado.toUpperCase()}</span>
            </div>

            <div className="fac-info-grid">
              <div className="fac-info-box">
                <p className="fac-info-label">Facturado a</p>
                <p className="fac-info-val">{viewF.cliente_nombre}</p>
                <p className="fac-info-sub">RUC: {viewF.cliente_ruc}</p>
              </div>
              <div className="fac-info-box">
                <p className="fac-info-label">Método de pago</p>
                <p className="fac-info-val">{viewF.metodo_pago}</p>
              </div>
            </div>

            <div className="tbl-wrap-sm">
              <table className="tbl-sm">
                <thead><tr><th>Código</th><th>Producto</th><th>Cant</th><th>P.Unit</th><th>Imp%</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {viewF.detalles.map(d => (
                    <tr key={d.id}>
                      <td className="mono">{d.producto_codigo}</td>
                      <td>{d.producto_nombre}</td>
                      <td>{d.cantidad}</td>
                      <td>USD {d.precio_unitario.toFixed(2)}</td>
                      <td>{d.impuesto}%</td>
                      <td>USD {d.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="fac-totales">
              <div className="fac-total-row"><span>Subtotal:</span><span>USD {viewF.subtotal.toFixed(2)}</span></div>
              <div className="fac-total-row"><span>Impuesto:</span><span>USD {viewF.impuesto_total.toFixed(2)}</span></div>
              <div className="fac-total-row fac-total-big"><span>TOTAL:</span><span>USD {viewF.total.toFixed(2)}</span></div>
            </div>

            <div className="fac-actions">
              <button onClick={() => printFactura(viewF)} className="btn btn-ghost"><Printer size={14} /> Imprimir</button>
              <button onClick={() => printFactura(viewF)} className="btn btn-primary"><Download size={14} /> Descargar</button>
export default MisFacturas;
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
