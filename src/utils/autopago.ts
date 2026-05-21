export function getRemainingMs(target: string | null | undefined): number {
  if (!target) return 0;
  return new Date(target).getTime() - Date.now();
}

export function formatAutopagoCountdown(target: string | null | undefined): string {
  const remainingMs = getRemainingMs(target);
  if (remainingMs <= 0) return 'Auto-pago disponible';

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}
