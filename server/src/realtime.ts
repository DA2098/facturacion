import type { Request, Response } from 'express';

export type RealtimeEvent = {
  type: 'sync';
  entity: string;
  action: 'create' | 'update' | 'delete' | 'register' | 'login';
  id?: string;
  timestamp: string;
  payload?: unknown;
};

const clients = new Set<Response>();

function writeEvent(res: Response, event: RealtimeEvent | { type: 'ready'; timestamp: string }) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function emitRealtime(event: RealtimeEvent) {
  for (const client of clients) {
    writeEvent(client, event);
  }
}

export function realtimeStream(req: Request, res: Response) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  clients.add(res);
  writeEvent(res, { type: 'ready', timestamp: new Date().toISOString() });

  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(res);
    res.end();
  });
}