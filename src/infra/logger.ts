// ─────────────────────────────────────────────
//  INFRASTRUCTURE — Logger
// ─────────────────────────────────────────────

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const ENABLED = true; // flip to false in production build

function log(level: LogLevel, ...args: unknown[]): void {
  if (!ENABLED && level === 'debug') return;
  const ts = new Date().toISOString().slice(11, 23);
  const prefix = `[WK ${ts}]`;
  // eslint-disable-next-line no-console
  console[level](prefix, ...args);
}

export const logger = {
  debug: (...a: unknown[]) => log('debug', ...a),
  info:  (...a: unknown[]) => log('info',  ...a),
  warn:  (...a: unknown[]) => log('warn',  ...a),
  error: (...a: unknown[]) => log('error', ...a),
};
