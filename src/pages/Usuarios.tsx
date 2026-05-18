// ═══════════════════════════════════════════════════════════════
// USUARIOS — CRUD de usuarios (solo Admin)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, UserCog, Shield } from 'lucide-react';
import { getUsuarios, updateUsuario, deleteUsuario, registrar } from '../services/db.ts';
import type { Usuario, Rol } from '../types/index.ts';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh.ts';
import Modal from '../components/Modal.tsx';
import Confirm from '../components/Confirm.tsx';

const empty = { nombre: '', email: '', password: '', rol: 'cliente' as Rol, profile_image_url: '', empresa: '', ruc: '', telefono: '', direccion: '' };

export default function Usuarios() {
  const [all, setAll] = useState<Usuario[]>([]);
  const [q, setQ] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [delId, setDelId] = useState('');

  const load = async () => setAll(await getUsuarios());
  useEffect(() => { void load(); }, []);
  useRealtimeRefresh(() => { void load(); }, true);

  const filtered = all.filter(u => {
    if (filtroRol !== 'todos' && u.rol !== filtroRol) return false;
    if (q) {
      const s = q.toLowerCase();
      return u.nombre.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.ruc.includes(s);
    }
    return true;
  });

  function openCreate() { setForm(empty); setEditId(null); setModalOpen(true); }
  function openEdit(u: Usuario) {
    setForm({
      nombre: u.nombre,
      email: u.email,
      password: u.password,
      rol: u.rol,
      profile_image_url: u.profile_image_url || '',
      empresa: u.empresa,
      ruc: u.ruc,
      telefono: u.telefono,
      direccion: u.direccion,
    });
    setEditId(u.id); setModalOpen(true);
  }

  async function handleImage(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, profile_image_url: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!form.nombre || !form.email) return;
    if (editId) {
      await updateUsuario(editId, form);
    } else {
      if (!form.password) return;
      await registrar(form);
    }
    setModalOpen(false); await load();
  }

  function confirmDel(id: string) { setDelId(id); setConfirmOpen(true); }
  function doDel() { void deleteUsuario(delId).then(() => load()); setConfirmOpen(false); }

  const rolColors: Record<string, string> = { admin: 'badge-admin', vendedor: 'badge-vendedor', contador: 'badge-contador', cliente: 'badge-cliente' };

  return (
    <div className="page">
      <div className="page-top">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-sub">Administrar usuarios, roles y permisos</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus size={16} /> Nuevo Usuario</button>
      </div>

      <div className="filters">
        <div className="search-wrap">
          <Search size={16} className="search-ic" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, email o RUC..." className="search-input" />
        </div>
        <div className="filter-tabs">
          {['todos', 'admin', 'vendedor', 'contador', 'cliente'].map(r => (
            <button key={r} onClick={() => setFiltroRol(r)} className={`ftab ${filtroRol === r ? 'ftab-on' : ''}`}>
              {r === 'todos' ? 'Todos' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><UserCog size={44} className="empty-icon" /><h3>Sin resultados</h3></div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Foto</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Empresa</th><th>RUC</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="usuario-foto-thumb">
                      {u.profile_image_url ? (
                        <img src={u.profile_image_url} alt={u.nombre} className="usuario-foto-img" />
                      ) : (
                        <div className="usuario-foto-empty">{u.nombre.charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                  </td>
                  <td className="fw-600">{u.nombre}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${rolColors[u.rol]}`}><Shield size={10} /> {u.rol}</span></td>
                  <td>{u.empresa}</td>
                  <td className="mono">{u.ruc}</td>
                  <td><span className={`badge ${u.activo ? 'badge-pagada' : 'badge-anulada'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="act-btns">
                      <button onClick={() => openEdit(u)} className="act-btn act-edit" title="Editar"><Edit2 size={14} /></button>
                      <button onClick={() => confirmDel(u.id)} className="act-btn act-del" title="Eliminar"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Usuario' : 'Nuevo Usuario'} wide>
        <div className="form-grid">
          <div className="form-col"><label className="form-label">Nombre *</label><input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="form-input" /></div>
          <div className="form-col"><label className="form-label">Email *</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="form-input" /></div>
          <div className="form-col"><label className="form-label">Contraseña {editId ? '' : '*'}</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="form-input" /></div>
          <div className="form-col">
            <label className="form-label">Rol</label>
            <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value as Rol})} className="form-input">
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
              <option value="contador">Contador</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
          <div className="form-col form-col-full">
            <label className="form-label">Imagen de perfil</label>
            <input type="file" accept="image/*" onChange={e => void handleImage(e.target.files?.[0] || null)} className="form-input" />
            <p className="form-help">Se guarda dentro del usuario. Si no la cambias, se conserva la actual.</p>
          </div>
          <div className="form-col form-col-full">
            <label className="form-label">Vista previa</label>
            <div className="img-preview-box">
              {form.profile_image_url ? (
                <img
                  src={form.profile_image_url}
                  alt="Vista previa del usuario"
                  className="img-preview"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x360?text=Imagen+no+disponible'; }}
                />
              ) : (
                <div className="img-preview-empty"><UserCog size={28} /><span>Sin imagen</span></div>
              )}
            </div>
          </div>
          <div className="form-col"><label className="form-label">Empresa</label><input value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} className="form-input" /></div>
          <div className="form-col"><label className="form-label">RUC</label><input value={form.ruc} onChange={e => setForm({...form, ruc: e.target.value})} className="form-input" /></div>
          <div className="form-col"><label className="form-label">Teléfono</label><input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="form-input" /></div>
          <div className="form-col"><label className="form-label">Dirección</label><input value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} className="form-input" /></div>
        </div>
        <div className="form-actions">
          <button onClick={() => setModalOpen(false)} className="btn btn-ghost">Cancelar</button>
          <button onClick={save} className="btn btn-primary">{editId ? 'Actualizar' : 'Crear'}</button>
        </div>
      </Modal>

      <Confirm open={confirmOpen} msg="¿Eliminar este usuario?" onYes={doDel} onNo={() => setConfirmOpen(false)} />
    </div>
  );
}
