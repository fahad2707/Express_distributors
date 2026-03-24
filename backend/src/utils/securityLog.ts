import type { Request } from 'express';

function clientIp(req: Request): string {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/** Structured logs for auth and abuse monitoring (no passwords or tokens). */
export function logSecurityEvent(
  event: 'auth_login_ok' | 'auth_login_fail' | 'auth_register' | 'rate_limit' | 'api_error' | 'order_track_fail',
  req: Request,
  detail: Record<string, unknown> = {}
): void {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ip: clientIp(req),
    path: req.path,
    method: req.method,
    ...detail,
  };
  console.log('[security]', JSON.stringify(payload));
}
