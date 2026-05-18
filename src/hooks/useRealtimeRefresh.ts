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
      handlerRef.current();
    });
  }, [enabled]);
}