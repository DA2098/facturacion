// ═══════════════════════════════════════════════════════════════
// PRODUCTOS — CRUD de productos (Admin y Vendedor)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Image as ImageIcon } from 'lucide-react';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../services/db.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh.ts';
import type { Producto } from '../types/index.ts';
import Modal from '../components/Modal.tsx';
import Confirm from '../components/Confirm.tsx';

const empty = { codigo: '', nombre: '', descripcion: '', image_url: '', precio: 0, impuesto: 18, stock: 1, categoria: '', activo: true };

export default function Productos() {
  const { user } = useAuth();
  const [all, setAll] = useState<Producto[]>([]);
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [delId, setDelId] = useState('');

  const load = async () => setAll(await getProductos());
  useEffect(() => { void load(); }, []);
  useRealtimeRefresh(() => { void load(); }, Boolean(user));

  const filtered = all.filter(p => {
    if (!q) return true;
    const s = q.toLowerCase();
    return p.nombre.toLowerCase().includes(s) || p.codigo.toLowerCase().includes(s) || p.categoria.toLowerCase().includes(s);
  });

  function openCreate() { setForm(empty); setEditId(null); setModalOpen(true); }
  function openEdit(p: Producto) {
    setForm({ codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion, image_url: p.image_url, precio: p.precio, impuesto: p.impuesto, stock: p.stock, categoria: p.categoria, activo: p.activo });
    setEditId(p.id); setModalOpen(true);
  }

  async function save() {
    if (!form.nombre || !form.codigo || form.precio <= 0) return;
    if (editId) {
      await updateProducto(editId, form);
    } else {
      // Evitar enviar al servidor si el código ya existe (409)
      if (all.some(p => p.codigo === form.codigo)) {
        alert('El código ya existe en el catálogo — usa otro código.');
        return;
      }
      const payload = { ...form, stock: form.stock > 0 ? form.stock : 1 };
      const created = await createProducto(payload as Producto);
      if (!created) {
        alert('Error creando el producto en el servidor. Comprueba la consola o inténtalo de nuevo.');
      }
    }
    setModalOpen(false); await load();
  }

  const isAdmin = user?.rol === 'admin';

  return (
    <div className="page">
      <div className="page-top">
        <div><h1 className="page-title">Productos</h1><p className="page-sub">Catálogo de productos y servicios</p></div>
        {isAdmin && <button onClick={openCreate} className="btn btn-primary"><Plus size={16} /> Nuevo Producto</button>}
      </div>

      <div className="filters">
        <div className="search-wrap"><Search size={16} className="search-ic" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto..." className="search-input" /></div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Package size={44} className="empty-icon" /><h3>Sin productos</h3></div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Imagen</th><th>Código</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Imp.%</th><th>Stock</th>{isAdmin && <th>Acciones</th>}</tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.nombre}
                        className="product-thumb"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/72x72?text=IMG'; }}
                      />
                    ) : (
                      <div className="product-thumb product-thumb-empty"><ImageIcon size={14} /></div>
                    )}
                  </td>
                  <td className="mono">{p.codigo}</td>
                  <td className="fw-600">{p.nombre}<br/><span className="td-desc">{p.descripcion}</span></td>
                  <td><span className="badge badge-cat">{p.categoria}</span></td>
                  <td>USD ${p.precio.toFixed(2)}</td>
                  <td>{p.impuesto}%</td>
                  <td><span className={`badge ${p.stock > 10 ? 'badge-pagada' : p.stock > 0 ? 'badge-emitida' : 'badge-anulada'}`}>{p.stock}</span></td>
                  {isAdmin && (
                    <td>
                      <div className="act-btns">
                        <button onClick={() => openEdit(p)} className="act-btn act-edit"><Edit2 size={14} /></button>
                        <button onClick={() => { setDelId(p.id); setConfirmOpen(true); }} className="act-btn act-del"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Producto' : 'Nuevo Producto'}>
        <div className="form-grid">
          <div className="form-col"><label className="form-label">Código *</label><input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className="form-input" /></div>
          <div className="form-col"><label className="form-label">Nombre *</label><input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="form-input" /></div>
          <div className="form-col form-col-full"><label className="form-label">Descripción</label><input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="form-input" /></div>
          <div className="form-col form-col-full">
            <label className="form-label">URL de la imagen</label>
            <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="form-input" placeholder="https://..." />
            <p className="form-help">Pega un vínculo directo de la imagen para mostrarla en la tienda.</p>
          </div>
          <div className="form-col form-col-full">
            <label className="form-label">Vista previa</label>
            <div className="img-preview-box">
              {form.image_url ? (
                <img
                  src={form.image_url}
                  alt="Vista previa del producto"
                  className="img-preview"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x360?text=Imagen+no+disponible'; }}
                />
              ) : (
                <div className="img-preview-empty"><ImageIcon size={28} /><span>Sin imagen</span></div>
              )}
            </div>
          </div>
          <div className="form-col"><label className="form-label">Precio (USD) *</label><input type="number" step="0.01" min="0" value={form.precio} onChange={e => setForm({...form, precio: parseFloat(e.target.value)||0})} className="form-input" /></div>
          <div className="form-col"><label className="form-label">Impuesto (%)</label><input type="number" min="0" max="100" value={form.impuesto} onChange={e => setForm({...form, impuesto: parseInt(e.target.value)||0})} className="form-input" /></div>
          <div className="form-col"><label className="form-label">Stock</label><input type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)||0})} className="form-input" /></div>
          <div className="form-col"><label className="form-label">Categoría</label><input value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="form-input" /></div>
        </div>
        <div className="form-actions">
          <button onClick={() => setModalOpen(false)} className="btn btn-ghost">Cancelar</button>
          <button onClick={save} className="btn btn-primary">{editId ? 'Actualizar' : 'Guardar'}</button>
        </div>
      </Modal>

      <Confirm open={confirmOpen} msg="¿Eliminar este producto?" onYes={() => { void deleteProducto(delId).then(() => load()); setConfirmOpen(false); }} onNo={() => setConfirmOpen(false)} />
    </div>
  );
}
