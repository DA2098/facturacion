// ═══════════════════════════════════════════════════════════════
// TIENDA — Vista del cliente para comprar productos
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { getProductos, createFactura, getUsuarios, getMetodosPago } from '../services/db.ts';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh.ts';
import type { Producto, DetalleFactura } from '../types/index.ts';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Package, Image as ImageIcon, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import ProfilePanel from '../components/ProfilePanel.tsx';

export default function Tienda() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<DetalleFactura[]>([]);
  const [q, setQ] = useState('');
  const [catFiltro, setCatFiltro] = useState('Todas');
  const [metodosPago, setMetodosPago] = useState<string[]>(['Efectivo', 'Tarjeta', 'Transferencia', 'Crédito']);
  const [metodoPago, setMetodoPago] = useState('Tarjeta');
  const [titularTarjeta, setTitularTarjeta] = useState('');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [vencimientoTarjeta, setVencimientoTarjeta] = useState('');
  const [cvvTarjeta, setCvvTarjeta] = useState('');
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  function onlyDigits(value: string, max = 4) {
    return value.replace(/\D/g, '').slice(0, max);
  }

  useEffect(() => {
    const load = async () => {
      const [productosDb, metodosDb] = await Promise.all([getProductos(), getMetodosPago()]);
      setProductos(productosDb.filter(p => p.activo && p.stock > 0));
      if (metodosDb.length > 0) {
        setMetodosPago(metodosDb);
        if (!metodosDb.includes('Tarjeta')) setMetodoPago(metodosDb[0]);
      }
    };
    void load();
  }, []);

  useRealtimeRefresh(() => {
    const load = async () => {
      const [productosDb, metodosDb] = await Promise.all([getProductos(), getMetodosPago()]);
      setProductos(productosDb.filter(p => p.activo && p.stock > 0));
      if (metodosDb.length > 0) {
        setMetodosPago(metodosDb);
      }
    };
    void load();
  }, Boolean(user));

  if (!user) return null;

  const categorias = ['Todas', ...Array.from(new Set(productos.map(p => p.categoria)))];

  const filtered = productos.filter(p => {
    if (catFiltro !== 'Todas' && p.categoria !== catFiltro) return false;
    if (q) return p.nombre.toLowerCase().includes(q.toLowerCase());
    return true;
  });

  function addToCart(p: Producto) {
    const existe = carrito.find(c => c.producto_id === p.id);
    if (existe) {
      setCarrito(carrito.map(c => c.producto_id === p.id
        ? { ...c, cantidad: c.cantidad + 1, subtotal: (c.cantidad + 1) * c.precio_unitario }
        : c));
    } else {
      setCarrito([...carrito, {
        id: Date.now().toString(36),
        producto_id: p.id, producto_nombre: p.nombre, producto_codigo: p.codigo,
        cantidad: 1, precio_unitario: p.precio, impuesto: p.impuesto, subtotal: p.precio,
      }]);
    }
  }

  function changeCant(id: string, delta: number) {
    setCarrito(carrito.map(c => {
      if (c.id !== id) return c;
      const newCant = Math.max(1, c.cantidad + delta);
      return { ...c, cantidad: newCant, subtotal: newCant * c.precio_unitario };
    }));
  }

  function removeFromCart(id: string) { setCarrito(carrito.filter(c => c.id !== id)); }

  const subtotal = carrito.reduce((s, c) => s + c.subtotal, 0);
  const impTotal = carrito.reduce((s, c) => s + c.subtotal * (c.impuesto / 100), 0);
  const total = subtotal + impTotal;

  async function comprar() {
    if (carrito.length === 0) return;
    if (metodoPago === 'Tarjeta') {
      const numeroPlano = numeroTarjeta.replace(/\s/g, '');
      if (!titularTarjeta.trim()) {
        setError('Ingresa el titular de la tarjeta para continuar.');
        return;
      }
      if (!/^\d{13,16}$/.test(numeroPlano)) {
        setError('Ingresa un número de tarjeta válido de 13 a 16 dígitos.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(vencimientoTarjeta)) {
        setError('Ingresa el vencimiento en formato MM/AA.');
        return;
      }
      if (!/^\d{3,4}$/.test(cvvTarjeta)) {
        setError('Ingresa un CVV válido.');
        return;
      }
    }
    if (metodoPago === 'Tarjeta' && !titularTarjeta.trim()) {
      setError('Ingresa el titular de la tarjeta para continuar.');
      return;
    }
    setError('');
    // asignar un vendedor (el primer admin como default)
    const admins = (await getUsuarios()).filter(u => u.rol === 'admin' || u.rol === 'vendedor');
    const vendedor = admins[0];
    const notasBase = 'Compra desde tienda online';
    const notasPago = metodoPago === 'Tarjeta' && titularTarjeta.trim()
      ? `${notasBase}. Titular: ${titularTarjeta.trim()}. Tarjeta terminada en ${numeroTarjeta.replace(/\s/g, '').slice(-4)}`
      : notasBase;
    await createFactura({
      cliente_id: user!.id,
      cliente_nombre: user!.nombre,
      cliente_ruc: user!.ruc,
      vendedor_id: vendedor?.id || 'sistema',
      vendedor_nombre: vendedor?.nombre || 'Sistema',
      metodo_pago: metodoPago,
      notas: notasPago,
      detalles: carrito,
    });
    setCarrito([]);
    setTitularTarjeta('');
    setNumeroTarjeta('');
    setVencimientoTarjeta('');
    setCvvTarjeta('');
    setProductos((await getProductos()).filter(p => p.activo && p.stock > 0));
    setExito('¡Compra realizada! Tu factura ha sido generada.');
    setTimeout(() => setExito(''), 4000);
  }

  const cardDigits = numeroTarjeta.replace(/\s/g, '');
  const cardLast4 = cardDigits.slice(-4).padStart(4, '•');
  const cardBrand = cardDigits.startsWith('4') ? 'VISA' : cardDigits.startsWith('5') ? 'MASTERCARD' : 'PAYMENT';

  return (
    <div className="page">
      <div className="page-top">
        <div><h1 className="page-title">Tienda</h1><p className="page-sub">Explora nuestros productos y realiza tu compra</p></div>
        <div className="cart-badge-wrap">
          <ShoppingCart size={22} />
          {carrito.length > 0 && <span className="cart-badge">{carrito.length}</span>}
        </div>
      </div>

      <ProfilePanel title="Mi perfil" subtitle="Actualiza tu foto, nombre y datos personales." />

      {exito && <div className="alert alert-ok"><CheckCircle size={16} /> {exito}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tienda-layout">
        <div className="tienda-products">
          <div className="tienda-filters">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto..." className="form-input tienda-search" />
            <div className="filter-tabs">
              {categorias.map(c => (
                <button key={c} onClick={() => setCatFiltro(c)} className={`ftab ${catFiltro === c ? 'ftab-on' : ''}`}>{c}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state"><Package size={44} className="empty-icon" /><h3>Sin productos</h3></div>
          ) : (
            <div className="product-grid">
              {filtered.map(p => (
                <div key={p.id} className="product-card">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.nombre}
                      className="product-image"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x360?text=Producto'; }}
                    />
                  ) : (
                    <div className="product-icon-wrap"><ImageIcon size={28} /></div>
                  )}
                  <div className="product-info">
                    <span className="product-code">{p.codigo}</span>
                    <h3 className="product-name">{p.nombre}</h3>
                    <p className="product-desc">{p.descripcion}</p>
                    <div className="product-bottom">
                      <span className="product-price">USD ${p.precio.toFixed(2)}</span>
                      <span className="product-stock">Stock: {p.stock}</span>
                    </div>
                  </div>
                  <button onClick={() => addToCart(p)} className="btn btn-primary btn-sm btn-full product-add-btn">
                    <Plus size={14} /> Agregar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Carrito */}
        <div className="tienda-cart">
          <h3 className="cart-title"><ShoppingCart size={18} /> Carrito ({carrito.length})</h3>
          {carrito.length === 0 ? (
            <p className="empty-text">Tu carrito está vacío</p>
          ) : (
            <>
              <div className="cart-items">
                {carrito.map(c => (
                  <div key={c.id} className="cart-item">
                    <div className="cart-item-info">
                      <p className="cart-item-name">{c.producto_nombre}</p>
                      <p className="cart-item-price">USD ${c.precio_unitario.toFixed(2)} c/u</p>
                    </div>
                    <div className="cart-item-controls">
                      <button onClick={() => changeCant(c.id, -1)} className="cart-qty-btn"><Minus size={12} /></button>
                      <span className="cart-qty">{c.cantidad}</span>
                      <button onClick={() => changeCant(c.id, 1)} className="cart-qty-btn"><Plus size={12} /></button>
                      <button onClick={() => removeFromCart(c.id)} className="cart-del-btn"><Trash2 size={12} /></button>
                    </div>
                    <p className="cart-item-sub">USD ${c.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="cart-totals">
                <div className="cart-total-row"><span>Subtotal</span><span>USD ${subtotal.toFixed(2)}</span></div>
                <div className="cart-total-row"><span>Impuesto</span><span>USD ${impTotal.toFixed(2)}</span></div>
                <div className="cart-total-row cart-total-big"><span>Total</span><span>USD ${total.toFixed(2)}</span></div>
              </div>
              <div className="form-row">
                <div className="form-col">
                  <label className="form-label">Método de pago</label>
                  <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} className="form-input">
                    {metodosPago.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {metodoPago === 'Tarjeta' && (
                  <div className="form-col form-col-full">
                    <div className="card-sim-card">
                      <div className="card-sim-top">
                        <span className="card-sim-chip" />
                        <span className="card-sim-brand"><CreditCard size={14} /> {cardBrand}</span>
                      </div>
                      <div className="card-sim-number">{cardDigits ? formatCardNumber(numeroTarjeta) : '•••• •••• •••• ••••'}</div>
                      <div className="card-sim-bottom">
                        <div>
                          <p className="card-sim-label">Titular</p>
                          <p className="card-sim-value">{titularTarjeta.trim() || 'JOSE ARMANDO'}</p>
                        </div>
                        <div>
                          <p className="card-sim-label">Vence</p>
                          <p className="card-sim-value">{vencimientoTarjeta || 'MM/AA'}</p>
                        </div>
                        <div>
                          <p className="card-sim-label">Estado</p>
                          <p className="card-sim-value card-sim-state"><ShieldCheck size={14} /> Autorización simulada</p>
                        </div>
                      </div>
                    </div>

                    <div className="form-row card-form-grid">
                      <div className="form-col form-col-full">
                        <label className="form-label">Número de tarjeta</label>
                        <input
                          value={numeroTarjeta}
                          onChange={e => setNumeroTarjeta(formatCardNumber(e.target.value))}
                          className="form-input"
                          placeholder="0000 0000 0000 0000"
                          inputMode="numeric"
                          maxLength={19}
                        />
                      </div>
                      <div className="form-col">
                        <label className="form-label">Titular de la tarjeta</label>
                        <input
                          value={titularTarjeta}
                          onChange={e => setTitularTarjeta(e.target.value.toUpperCase())}
                          className="form-input"
                          placeholder="Nombre como aparece en la tarjeta"
                        />
                      </div>
                      <div className="form-col">
                        <label className="form-label">Vencimiento</label>
                        <input
                          value={vencimientoTarjeta}
                          onChange={e => setVencimientoTarjeta(formatExpiry(e.target.value))}
                          className="form-input"
                          placeholder="MM/AA"
                          inputMode="numeric"
                          maxLength={5}
                        />
                      </div>
                      <div className="form-col">
                        <label className="form-label">CVV</label>
                        <input
                          value={cvvTarjeta}
                          onChange={e => setCvvTarjeta(onlyDigits(e.target.value, 4))}
                          className="form-input"
                          placeholder="123"
                          inputMode="numeric"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <p className="card-sim-hint"><Sparkles size={14} /> Pago simulado con validación básica de datos. No se procesa una tarjeta real.</p>
                  </div>
                )}
              </div>
              <button onClick={() => void comprar()} className="btn btn-success btn-full cart-buy-btn">
                <CheckCircle size={16} /> Finalizar Compra
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
