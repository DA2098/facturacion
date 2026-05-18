// ═══════════════════════════════════════════════════════════════
// REGISTRO — Registro de nuevos usuarios/empresas
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { UserPlus } from 'lucide-react';
import type { Rol } from '../types/index.ts';

export default function Registro() {
  const { registro } = useAuth();
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', confirm: '',
    rol: 'cliente' as Rol, empresa: '', ruc: '', telefono: '', direccion: '',
  });
  const [error, setError] = useState('');

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.nombre || !form.email || !form.password) {
      setError('Nombre, email y contraseña son obligatorios'); return;
    }
    if (form.password.length < 4) { setError('La contraseña debe tener al menos 4 caracteres'); return; }
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return; }
    const { confirm, ...data } = form;
    const err = await registro(data as any);
    if (err) setError(err);
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <img src="/assets/logo.png" alt="FACTS Logo" className="auth-logo-img" />
          <h1 className="auth-title">Crear Cuenta</h1>
          <p className="auth-subtitle">Regístrate para acceder al sistema</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Nombre completo *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className="form-input" placeholder="Tu nombre" />
            </div>
            <div className="form-col">
              <label className="form-label">Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="form-input" placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Contraseña *</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="form-input" placeholder="Mínimo 4 caracteres" />
            </div>
            <div className="form-col">
              <label className="form-label">Confirmar contraseña *</label>
              <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} className="form-input" placeholder="Repetir contraseña" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Tipo de cuenta</label>
              <select value={form.rol} onChange={e => set('rol', e.target.value)} className="form-input">
                <option value="cliente">Cliente / Empresa</option>
                <option value="vendedor">Vendedor</option>
                <option value="contador">Contador</option>
              </select>
            </div>
            <div className="form-col">
              <label className="form-label">RUC / NIT</label>
              <input value={form.ruc} onChange={e => set('ruc', e.target.value)} className="form-input" placeholder="20512345678" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Empresa</label>
              <input value={form.empresa} onChange={e => set('empresa', e.target.value)} className="form-input" placeholder="Nombre de empresa" />
            </div>
            <div className="form-col">
              <label className="form-label">Teléfono</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)} className="form-input" placeholder="999-000-000" />
            </div>
          </div>

          <div className="form-col">
            <label className="form-label">Dirección</label>
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)} className="form-input" placeholder="Av. Principal 123" />
          </div>

          <button type="submit" className="btn btn-primary btn-full">
            <UserPlus size={16} />
            Crear Cuenta
          </button>

          <p className="auth-link-text">
            ¿Ya tienes cuenta? <Link to="/login" className="auth-link">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
