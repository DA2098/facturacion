// ═══════════════════════════════════════════════════════════════
// AuthContext — Maneja sesión del usuario (login/logout/registro)
// ═══════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Usuario, Sesion } from '../types/index.ts';

interface AuthContextType {
  user: Usuario | null;
  login: (email: string, password: string) => Promise<string | null>;
  registro: (data: Omit<Usuario, 'id' | 'activo' | 'created_at'>) => Promise<string | null>;
  logout: () => void;
  updateSessionUser: (user: Usuario) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);

  // restaurar sesión al cargar
  useEffect(() => {
    const saved = localStorage.getItem('fy_session');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* nada */ }
    }
  }, []);
  // API base (Vite env or fallback)
  const API = (import.meta as any).env?.VITE_API_URL || '';

  async function login(email: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return err.error || 'Email o contraseña incorrectos';
      }
      const data: Sesion = await res.json();
      // data may be { usuario, token }
      // store usuario in context and token in localStorage
      const usuario = (data as any).usuario || (data as any).user || null;
      const token = (data as any).token || '';
      if (!usuario) return 'Respuesta inválida del servidor';
      setUser(usuario);
      localStorage.setItem('fy_session', JSON.stringify(usuario));
      if (token) localStorage.setItem('fy_token', token);
      return null;
    } catch (err) {
      return 'Error de conexión con el servidor';
    }
  }

  async function registro(data: Omit<Usuario, 'id' | 'activo' | 'created_at'>): Promise<string | null> {
    try {
      const res = await fetch(`${API}/api/auth/registro`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return err.error || 'Error en el registro';
      }
      const resp = await res.json();
      const usuario = resp.usuario || resp.user || null;
      const token = resp.token || '';
      if (!usuario) return 'Respuesta inválida del servidor';
      setUser(usuario);
      localStorage.setItem('fy_session', JSON.stringify(usuario));
      if (token) localStorage.setItem('fy_token', token);
      return null;
    } catch (err) {
      return 'Error de conexión con el servidor';
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('fy_session');
    localStorage.removeItem('fy_token');
  }

  function updateSessionUser(nextUser: Usuario) {
    setUser(nextUser);
    localStorage.setItem('fy_session', JSON.stringify(nextUser));
  }

  return (
    <AuthContext.Provider value={{ user, login, registro, logout, updateSessionUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
