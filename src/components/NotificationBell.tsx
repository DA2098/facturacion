import React from 'react';
import { useNotification } from '../context/NotificationContext.tsx';
import { FiBell, FiTrash2 } from 'react-icons/fi';

const NotificationIcon: React.FC<{ onClick: () => void; count: number }> = ({ onClick, count }) => (
  <button className="relative p-2" onClick={onClick} aria-label="Notificaciones">
    <FiBell size={22} />
    {count > 0 && (
      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
        {count}
      </span>
    )}
  </button>
);

const NotificationPanel: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { notifications, removeNotification, clearNotifications } = useNotification();
  return (
    <div className={`fixed top-16 right-4 w-80 bg-white shadow-lg rounded-lg z-50 transition-all ${open ? 'block' : 'hidden'}`} style={{ maxHeight: 400, overflowY: 'auto' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="font-semibold">Notificaciones</span>
        <button className="text-xs text-blue-600" onClick={clearNotifications}>Limpiar todas</button>
      </div>
      <ul className="divide-y">
        {notifications.length === 0 && <li className="p-4 text-center text-gray-500">Sin notificaciones</li>}
        {notifications.map((n: import("../context/NotificationContext.tsx").Notification) => (
          <li key={n.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
            <span className="text-sm">{n.message}</span>
            <button className="ml-2 text-gray-400 hover:text-red-500" onClick={() => removeNotification(n.id)}>
              <FiTrash2 />
            </button>
          </li>
        ))}
      </ul>
      <div className="p-2 text-right">
        <button className="text-xs text-gray-500" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export function NotificationBell() {
  const { notifications } = useNotification();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <NotificationIcon onClick={() => setOpen(o => !o)} count={notifications.length} />
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
