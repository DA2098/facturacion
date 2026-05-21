import { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { subscribeRealtime } from '../services/realtime';

// Mapea eventos a mensajes y roles
function getNotificationForEvent(event, user) {
  if (!event || !user) return null;
  const { type, entity, action, payload } = event;
  // ADMIN
  if (user.rol === 'admin') {
    if (entity === 'productos' && action === 'create') {
      return { message: `Has creado el producto "${payload?.nombre || payload?.nombre || ''}".`, type: 'info' };
    }
    if (entity === 'productos' && action === 'update') {
      return { message: `Producto actualizado: "${payload?.nombre || ''}".`, type: 'info' };
    }
  }
  // CLIENTE
  if (user.rol === 'cliente') {
    if (entity === 'facturas' && action === 'create' && payload?.cliente_id === user.id) {
      return { message: 'Se ha emitido una nueva factura.', type: 'info' };
    }
    if (entity === 'facturas' && action === 'update' && payload?.estado === 'pagada' && payload?.cliente_id === user.id) {
      return { message: 'Tu factura ha sido pagada.', type: 'success' };
    }
  }
  // VENDEDOR
  if (user.rol === 'vendedor') {
    if (entity === 'facturas' && action === 'create' && payload?.vendedor_id === user.id) {
      return { message: `Has emitido la factura #${payload?.id || ''}.`, type: 'info' };
    }
    if (entity === 'facturas' && action === 'update' && payload?.estado === 'pagada' && payload?.vendedor_id === user.id) {
      return { message: `Has marcado la factura #${payload?.id || ''} como pagada.`, type: 'success' };
    }
  }
  // CONTADOR
  if (user.rol === 'contador') {
    if (entity === 'facturas' && action === 'create') {
      return { message: `Se ha emitido una nueva factura para revisión.`, type: 'info' };
    }
    if (entity === 'facturas' && action === 'update' && payload?.estado === 'pagada') {
      return { message: `Factura #${payload?.id || ''} ha sido pagada.`, type: 'success' };
    }
  }
  return null;
}

export function useRealtimeNotifications() {
  const { addNotification } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeRealtime((event) => {
      console.debug('[useRealtimeNotifications] event', event, 'user', user?.id, user?.rol);
      const notif = getNotificationForEvent(event, user);
      if (notif) {
        console.debug('[useRealtimeNotifications] adding notification', notif);
        addNotification({
          id: `${event.entity}-${event.action}-${event.id}-${Date.now()}`,
          message: notif.message,
          type: notif.type,
          createdAt: new Date().toISOString(),
        });
      }
    });
    return () => unsub();
  }, [user, addNotification]);
}
