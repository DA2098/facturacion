// ═══════════════════════════════════════════════════════════════
// TIENDA — Vista del cliente para comprar productos
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { getProductos, createFactura, getUsuarios } from '../services/db.ts';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh.ts';
import type { Producto, DetalleFactura } from '../types/index.ts';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Package, Image as ImageIcon } from 'lucide-react';
import ProfilePanel from '../components/ProfilePanel.tsx';

export default function Tienda() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<DetalleFactura[]>([]);
  const [q, setQ] = useState('');
  const [catFiltro, setCatFiltro] = useState('Todas');
  const [exito, setExito] = useState('');

  useEffect(() => {
    const load = async () => setProductos((await getProductos()).filter(p => p.activo && p.stock > 0));
    void load();
  }, []);

  useRealtimeRefresh(() => {
    const load = async () => setProductos((await getProductos()).filter(p => p.activo && p.stock > 0));
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
    // asignar un vendedor (el primer admin como default)
    const admins = (await getUsuarios()).filter(u => u.rol === 'admin' || u.rol === 'vendedor');
    const vendedor = admins[0];
    await createFactura({
      cliente_id: user!.id,
      cliente_nombre: user!.nombre,
      cliente_ruc: user!.ruc,
      vendedor_id: vendedor?.id || 'sistema',
      vendedor_nombre: vendedor?.nombre || 'Sistema',
      metodo_pago: 'Tarjeta',
      notas: 'Compra desde tienda online',
      detalles: carrito,
    });
    setCarrito([]);
    setProductos((await getProductos()).filter(p => p.activo && p.stock > 0));
    setExito('¡Compra realizada! Tu factura ha sido generada.');
    setTimeout(() => setExito(''), 4000);
  }

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
