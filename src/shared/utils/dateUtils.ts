// ─────────────────────────────────────────────
//  SHARED UTILS — Date & Format Helpers
// ─────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatThaiDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString('th-TH', opts ?? {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

export function formatThaiDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
}

export function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

export function withinDays(iso: string, days: number): boolean {
  return daysSince(iso) <= days;
}

/** Format stopwatch milliseconds as H:MM:SS or MM:SS */
export function formatStopwatch(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return (h ? `${h}:` : '') +
    (h && m < 10 ? '0' : '') + m + ':' +
    (s < 10 ? '0' : '') + s;
}

/** Generate a UUID (uses crypto if available, else fallback) */
export function uuid(): string {
  return crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}
