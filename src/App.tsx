// ═══════════════════════════════════════════════════════════════
// APP.TSX — Punto de entrada con rutas protegidas por rol
// ═══════════════════════════════════════════════════════════════

import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import Sidebar from './components/Sidebar.tsx';
import Login from './pages/Login.tsx';
import Registro from './pages/Registro.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Usuarios from './pages/Usuarios.tsx';
import Productos from './pages/Productos.tsx';
import Ventas from './pages/Ventas.tsx';
import Facturas from './pages/Facturas.tsx';
import Reportes from './pages/Reportes.tsx';
import Tienda from './pages/Tienda.tsx';
import MisFacturas from './pages/MisFacturas.tsx';
import { SSEDebugPanel } from './components/SSEDebugPanel';

// Layout protegido: requiere login
function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main"><Outlet /></main>
    </div>
  );
}

// Rutas públicas: redirigir si ya tiene sesión
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) {
    if (user.rol === 'cliente') return <Navigate to="/tienda" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  const defaultRoute = user?.rol === 'cliente' ? '/tienda' : '/dashboard';

  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/registro" element={<PublicRoute><Registro /></PublicRoute>} />

      {/* Protegidas */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/tienda" element={<Tienda />} />
        <Route path="/mis-facturas" element={<MisFacturas />} />
        <Route path="/facturas" element={<Facturas />} />
        <Route path="/mis-facturas" element={<MisFacturas />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? defaultRoute : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
          <SSEDebugPanel />
        </HashRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}
