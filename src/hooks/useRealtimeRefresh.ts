import { useEffect, useRef } from 'react';
import { subscribeRealtime } from '../services/realtime.ts';

export function useRealtimeRefresh(onRefresh: () => void, enabled = true) {
  const handlerRef = useRef(onRefresh);

  useEffect(() => {
    handlerRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;
    return subscribeRealtime(() => {
      console.debug('[useRealtimeRefresh] realtime event -> invoking handler');
      try { handlerRef.current(); } catch (e) { console.error('[useRealtimeRefresh] handler error', e); }
    });
  }, [enabled]);
}