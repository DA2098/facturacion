// ═══════════════════════════════════════════════════════════════
// VENTAS — Punto de Venta (Admin y Vendedor)
// Seleccionar cliente, agregar productos, emitir factura
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { getUsuariosByRol, getProductos, createFactura } from '../services/db.ts';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh.ts';
import type { Usuario, Producto, DetalleFactura } from '../types/index.ts';
import { Plus, Trash2, ShoppingCart, CheckCircle } from 'lucide-react';

export default function Ventas() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [clientes, setClientes] = useState<Usuario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [detalles, setDetalles] = useState<DetalleFactura[]>([]);
  const [prodSel, setProdSel] = useState('');
  const [cant, setCant] = useState(1);
  const [metodo, setMetodo] = useState('Efectivo');
  const [notas, setNotas] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    const load = async () => {
      setClientes(await getUsuariosByRol('cliente'));
      setProductos((await getProductos()).filter(p => p.activo && p.stock > 0));
    };
    void load();
  }, []);

  useRealtimeRefresh(() => {
    const load = async () => {
      setClientes(await getUsuariosByRol('cliente'));
      setProductos((await getProductos()).filter(p => p.activo && p.stock > 0));
    };
    void load();
  }, Boolean(user));

  if (!user) return null;

  function agregar() {
    if (!prodSel || cant < 1) return;
    const p = productos.find(x => x.id === prodSel);
    if (!p) return;
    const existe = detalles.find(d => d.producto_id === p.id);
    if (existe) {
      setDetalles(detalles.map(d => d.producto_id === p.id ? { ...d, cantidad: d.cantidad + cant, subtotal: (d.cantidad + cant) * d.precio_unitario } : d));
    } else {
      const linea: DetalleFactura = {
        id: Date.now().toString(36),
        producto_id: p.id,
        producto_nombre: p.nombre,
        producto_codigo: p.codigo,
        cantidad: cant,
        precio_unitario: p.precio,
        impuesto: p.impuesto,
        subtotal: cant * p.precio,
      };
      setDetalles([...detalles, linea]);
    }
    setProdSel(''); setCant(1);
  }

  function quitar(id: string) { setDetalles(detalles.filter(d => d.id !== id)); }

  const subtotal = detalles.reduce((s, d) => s + d.subtotal, 0);
  const impTotal = detalles.reduce((s, d) => s + d.subtotal * (d.impuesto / 100), 0);
  const total = subtotal + impTotal;

  async function emitir() {
    if (!clienteId || detalles.length === 0) return;
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return;
    await createFactura({
      cliente_id: cli.id,
      cliente_nombre: cli.nombre,
      cliente_ruc: cli.ruc,
      vendedor_id: user!.id,
      vendedor_nombre: user!.nombre,
      metodo_pago: metodo,
      notas,
      detalles,
    });
    setExito('Factura emitida correctamente');
    setDetalles([]); setClienteId(''); setNotas('');
    setProductos((await getProductos()).filter(p => p.activo && p.stock > 0));
    setTimeout(() => setExito(''), 3000);
  }

  return (
    <div className="page">
      <div className="page-top">
        <div><h1 className="page-title">Punto de Venta</h1><p className="page-sub">Crear nueva factura de venta</p></div>
      </div>

      {exito && <div className="alert alert-ok"><CheckCircle size={16} /> {exito}</div>}

      <div className="venta-layout">
        {/* Lado izquierdo: selección */}
        <div className="venta-left">
          <div className="venta-section">
            <label className="form-label">Cliente *</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="form-input">
              <option value="">-- Seleccionar cliente --</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} — RUC: {c.ruc}</option>)}
            </select>
          </div>

          <div className="venta-section">
            <label className="form-label">Agregar producto</label>
            <div className="venta-add-row">
              <select value={prodSel} onChange={e => setProdSel(e.target.value)} className="form-input venta-prod-sel">
                <option value="">-- Producto --</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre} (S/{p.precio.toFixed(2)}) Stock:{p.stock}</option>)}
              </select>
              <input type="number" min="1" value={cant} onChange={e => setCant(parseInt(e.target.value) || 1)} className="form-input venta-cant" placeholder="Cant" />
              <button onClick={agregar} className="btn btn-primary btn-sm"><Plus size={14} /> Agregar</button>
            </div>
          </div>

          {detalles.length > 0 && (
            <div className="tbl-wrap-sm">
              <table className="tbl-sm">
                <thead><tr><th>Producto</th><th>Cant</th><th>P.Unit</th><th>Imp%</th><th>Subtotal</th><th></th></tr></thead>
                <tbody>
                  {detalles.map(d => (
                    <tr key={d.id}>
                      <td><span className="mono">{d.producto_codigo}</span> {d.producto_nombre}</td>
                      <td>{d.cantidad}</td>
                      <td>S/ {d.precio_unitario.toFixed(2)}</td>
                      <td>{d.impuesto}%</td>
                      <td>S/ {d.subtotal.toFixed(2)}</td>
                      <td><button onClick={() => quitar(d.id)} className="act-btn act-del"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Método de pago</label>
              <select value={metodo} onChange={e => setMetodo(e.target.value)} className="form-input">
                <option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option><option>Crédito</option>
              </select>
            </div>
            <div className="form-col">
              <label className="form-label">Notas</label>
              <input value={notas} onChange={e => setNotas(e.target.value)} className="form-input" placeholder="Observaciones..." />
            </div>
          </div>
        </div>

        {/* Lado derecho: totales */}
        <div className="venta-right">
          <div className="venta-totales">
            <h3 className="venta-totales-title">Resumen</h3>
            <div className="venta-total-row"><span>Subtotal</span><span>S/ {subtotal.toFixed(2)}</span></div>
            <div className="venta-total-row"><span>Impuesto</span><span>S/ {impTotal.toFixed(2)}</span></div>
            <div className="venta-total-row venta-total-final"><span>TOTAL</span><span>S/ {total.toFixed(2)}</span></div>
            <div className="venta-total-row venta-items"><span>Ítems</span><span>{detalles.length}</span></div>
              <button onClick={() => void emitir()} disabled={!clienteId || detalles.length === 0} className="btn btn-success btn-full venta-emit-btn">
              <ShoppingCart size={18} /> Emitir Factura
            </button>
            <button onClick={() => nav('/facturas')} className="btn btn-ghost btn-full">Ver Facturas</button>
          </div>
        </div>
      </div>
    </div>
  );
}
