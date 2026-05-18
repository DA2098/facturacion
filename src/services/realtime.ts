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
  source = new EventSource(`${API}/api/realtime`);

  source.onmessage = event => {
    try {
      const data = JSON.parse(event.data) as RealtimeEvent;
      for (const listener of listeners) listener(data);
    } catch {
      // Ignorar mensajes de keep-alive o payload inválido.
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