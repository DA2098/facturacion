type RealtimeEvent = {
  type: 'sync' | 'ready';
  entity?: string;
  action?: 'create' | 'update' | 'delete' | 'register' | 'login';
  id?: string;
  timestamp: string;
  payload?: unknown;
};

const API = (import.meta as any).env?.VITE_API_URL || '';
const listeners = new Set<(event: RealtimeEvent) => void>();
let source: EventSource | null = null;

function connect() {
  if (source || typeof window === 'undefined') return;
  const url = `${API}/api/realtime`;
  console.debug('[realtime] connecting to', url);
  source = new EventSource(url);

  source.onmessage = event => {
    try {
      const data = JSON.parse(event.data) as RealtimeEvent;
      console.debug('[realtime] event received', data);
      for (const listener of listeners) listener(data);
    } catch (err) {
      // Ignorar mensajes de keep-alive o payload inválido.
      // Pero loguear por si hay problemas de parseo
      console.debug('[realtime] failed to parse event', err);
    }
  };

  source.onerror = () => {
    if (!listeners.size && source) {
      source.close();
      source = null;
    }
  };
}

export function subscribeRealtime(listener: (event: RealtimeEvent) => void) {
  listeners.add(listener);
  connect();

  return () => {
    listeners.delete(listener);
    if (!listeners.size && source) {
      source.close();
      source = null;
    }
  };
}