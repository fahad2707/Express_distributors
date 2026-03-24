/**
 * Origin of the backend (no trailing path) for server-side proxies.
 * Prefer BACKEND_URL on Vercel; fall back to NEXT_PUBLIC_API_URL; then local dev.
 */
export function getBackendBaseForProxy(): string {
  const base = process.env.BACKEND_URL?.trim();
  if (base) return base.replace(/\/+$/, '').replace(/\/api\/?$/, '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl) return apiUrl.replace(/\/+$/, '').replace(/\/api\/?$/, '');
  return 'http://localhost:5001';
}
