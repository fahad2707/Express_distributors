import { ensureFetchOriginForBackend } from './backend-proxy-base';

/** Normalize NEXT_PUBLIC_API_URL to a full .../api base (no trailing slash). */
function normalizePublicApiUrl(envVal: string | undefined): string | null {
  const raw = envVal?.trim();
  if (!raw) return null;
  let s = raw.replace(/\/+$/, '');
  s = ensureFetchOriginForBackend(s);
  if (!/\/api\/?$/i.test(s)) s = `${s}/api`;
  return s.replace(/\/+$/, '');
}

/**
 * Base URL for axios (admin + store).
 *
 * - **Browser + `NEXT_PUBLIC_API_URL` set:** call the API **directly** (e.g. Render). The
 *   Vercel `/api` proxy can drop `Authorization` in some setups; CORS on the backend
 *   already allows `*.vercel.app`.
 * - **Browser without it:** same-origin `/api` (Vercel must set `BACKEND_URL` for the proxy).
 * - **Server (RSC, etc.):** `NEXT_PUBLIC_API_URL` or `BACKEND_URL` + `/api`.
 */
export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const direct = normalizePublicApiUrl(process.env.NEXT_PUBLIC_API_URL);
    if (direct) return direct;
    return '/api';
  }
  const fromPub = normalizePublicApiUrl(process.env.NEXT_PUBLIC_API_URL);
  if (fromPub) return fromPub;
  const backend = process.env.BACKEND_URL?.trim();
  if (backend) {
    const base = ensureFetchOriginForBackend(
      backend.replace(/\/+$/, '').replace(/\/api\/?$/i, '')
    );
    return `${base}/api`;
  }
  return 'http://localhost:5001/api';
}
