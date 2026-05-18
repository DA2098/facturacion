// ═══════════════════════════════════════════════════════════════
// LOGIN — Pantalla de inicio de sesión
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Completa todos los campos'); return; }
    const err = await login(email, password);
    if (err) setError(err);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/assets/logo.png" alt="FACTS Logo" className="auth-logo-img" />
          <h1 className="auth-title">FACTS</h1>
          <p className="auth-subtitle">Sistema de Facturación Electrónica</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <h2 className="auth-form-title">Iniciar Sesión</h2>

          {error && <div className="auth-error">{error}</div>}

          <div className="input-group">
            <Mail size={16} className="input-icon" />
            <input
              type="email"
              placeholder="Ingresa tu correo"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="input-group">
            <Lock size={16} className="input-icon" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="input-toggle">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-full">
            <LogIn size={16} />
            Ingresar
          </button>

          <p className="auth-link-text">
            ¿No tienes cuenta? <Link to="/registro" className="auth-link">Regístrate aquí</Link>
          </p>
        </form>

        {/* Demo accounts removed */}
      </div>
    </div>
  );
}
