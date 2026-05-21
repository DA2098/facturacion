import React, { useEffect, useState } from 'react';
import { subscribeRealtime } from '../services/realtime';

export function SSEDebugPanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeRealtime((event) => {
      setEvents(evts => [{...event, received: new Date().toISOString()}, ...evts].slice(0, 50));
    });
    return unsub;
  }, []);

  return (
    <div style={{position: 'fixed', bottom: 0, right: 0, zIndex: 9999}}>
      <button style={{background: '#222', color: '#fff', borderRadius: 4, padding: '4px 12px', margin: 4, fontSize: 12}} onClick={() => setOpen(o => !o)}>
        {open ? 'Ocultar' : 'Ver'} SSE Debug ({events.length})
      </button>
      {open && (
        <div style={{background: '#fff', color: '#222', width: 400, maxHeight: 300, overflow: 'auto', border: '1px solid #888', borderRadius: 4, fontSize: 12, boxShadow: '0 2px 8px #0002', margin: 4}}>
          <div style={{padding: 4, borderBottom: '1px solid #eee', fontWeight: 'bold'}}>Eventos SSE recientes</div>
          <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
            {events.map((e, i) => (
              <li key={i} style={{borderBottom: '1px solid #eee', padding: 4}}>
                <div><b>{e.entity}</b> <b>{e.action}</b> <span style={{color:'#888'}}>{e.received}</span></div>
                <pre style={{whiteSpace: 'pre-wrap', margin: 0}}>{JSON.stringify(e, null, 2)}</pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
