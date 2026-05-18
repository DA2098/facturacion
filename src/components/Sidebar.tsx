// ═══════════════════════════════════════════════════════════════
// Sidebar — Navegación lateral según rol del usuario
// ═══════════════════════════════════════════════════════════════

import { NavLink } from 'react-router-dom';
import type { ElementType } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard, Users, Package, FileText,
  ShoppingCart, LogOut, Receipt, BarChart3, UserCog,
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  // Menú según rol
  const links: { to: string; label: string; icon: ElementType }[] = [];

  if (user.rol === 'admin') {
    links.push(
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/usuarios', label: 'Usuarios', icon: UserCog },
      { to: '/productos', label: 'Productos', icon: Package },
      { to: '/ventas', label: 'Nueva Venta', icon: ShoppingCart },
      { to: '/facturas', label: 'Facturas', icon: FileText },
      { to: '/reportes', label: 'Reportes', icon: BarChart3 },
    );
  } else if (user.rol === 'vendedor') {
    links.push(
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/productos', label: 'Productos', icon: Package },
      { to: '/ventas', label: 'Nueva Venta', icon: ShoppingCart },
      { to: '/facturas', label: 'Mis Facturas', icon: FileText },
    );
  } else if (user.rol === 'contador') {
    links.push(
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/facturas', label: 'Facturas', icon: FileText },
      { to: '/reportes', label: 'Reportes', icon: BarChart3 },
    );
  } else {
    // cliente
    links.push(
      { to: '/tienda', label: 'Tienda', icon: ShoppingCart },
      { to: '/mis-facturas', label: 'Mis Facturas', icon: Receipt },
    );
  }

  const rolLabels: Record<string, string> = {
    admin: 'Administrador',
    vendedor: 'Vendedor',
    contador: 'Contador',
    cliente: 'Cliente',
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/assets/logo.png" alt="FACTS Logo" className="sidebar-logo-img" />
        <div>
          <h1 className="sidebar-title">FACTS</h1>
          <p className="sidebar-sub">Facturación Electrónica</p>
        </div>
      </div>

      <div className="sidebar-user">
        <div
          className={`sidebar-avatar ${user.profile_image_url ? 'sidebar-avatar-img' : ''}`}
          style={user.profile_image_url ? { backgroundImage: `url(${user.profile_image_url})` } : undefined}
        >{user.profile_image_url ? '' : user.nombre.charAt(0)}</div>
        <div>
          <p className="sidebar-uname">{user.nombre}</p>
          <p className="sidebar-urole">{rolLabels[user.rol]}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-on' : ''}`}
          >
            <l.icon size={18} />
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button type="button" onClick={logout} className="sidebar-link sidebar-logout">
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
        <Users size={12} />
        <span className="sidebar-version">v2.0.0 — {user.empresa}</span>
      </div>
    </aside>
  );
}
