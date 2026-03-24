/**
 * In the browser, always use same-origin `/api` so Vercel's route handler can
 * proxy to Railway via BACKEND_URL (no NEXT_PUBLIC_* required at build).
 * On the server, use NEXT_PUBLIC_API_URL or BACKEND_URL + /api.
 */
export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  const pub = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (pub) return pub;
  const backend = process.env.BACKEND_URL?.trim();
  if (backend) {
    const base = backend.replace(/\/+$/, '').replace(/\/api\/?$/, '');
    return `${base}/api`;
  }
  return 'http://localhost:5001/api';
}
