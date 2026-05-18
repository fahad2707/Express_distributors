import axios from 'axios';
import { resolveApiBaseUrl } from './api-base-url';
import { ADMIN_AUTH_REDIRECT_MESSAGE } from './admin-auth-redirect';

const adminApi = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

export const uploadApi = axios.create({
  timeout: 60000,
});

/**
 * Just-logged-in grace period (ms). Right after the user signs in we don't want
 * a stray 401 — from a stale cached fetch, an aborted nav, dev-server Fast
 * Refresh, etc. — to bounce them straight back to the login page. We log the
 * failure to the console and toast (handled per-page) but keep the session.
 */
const LOGIN_GRACE_MS = 8000;
const LOGIN_AT_KEY = 'adminLoginAt';

function isWithinLoginGrace(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(LOGIN_AT_KEY);
  if (!raw) return false;
  const at = parseInt(raw, 10);
  if (!at || Number.isNaN(at)) return false;
  return Date.now() - at < LOGIN_GRACE_MS;
}

function attachAdminAuth(config: import('axios').InternalAxiosRequestConfig) {
  config.baseURL = resolveApiBaseUrl();
  // Default instance sets Content-Type: json — that breaks multipart (multer sees no file).
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  // The CSV category assignment can take long enough that Vercel's /api proxy
  // may time out (resulting in 503). For this specific endpoint, bypass the
  // proxy and hit Railway directly via NEXT_PUBLIC_API_URL.
  const endpoint = String(config.url || '');
  if (typeof window !== 'undefined' && endpoint.includes('/products/assign-categories-csv')) {
    const direct = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (direct) {
      let d = direct.replace(/\/+$/, '');
      if (!/^https?:\/\//i.test(d)) {
        if (/^(localhost|127\.0\.0\.1)(:|$)/i.test(d)) d = `http://${d}`;
        else d = `https://${d}`;
      }
      if (!/\/api\/?$/i.test(d)) d = `${d}/api`;
      config.baseURL = d;
    }
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const path = String(config.url || '');
  const isAuthLogin = path.includes('/auth/admin/login');

  if (typeof window !== 'undefined' && !isAuthLogin && !token) {
    // No token: reject the request and let the page / layout handle the
    // redirect. We do NOT force a window.location.replace here — those
    // hard redirects can race with the AdminLayoutClient's own check and
    // wipe a fresh session that was set milliseconds earlier.
    return Promise.reject(new Error(ADMIN_AUTH_REDIRECT_MESSAGE));
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

uploadApi.interceptors.request.use(attachAdminAuth);
adminApi.interceptors.request.use(attachAdminAuth);

const RETRY_DELAY_MS = 2200;
const MAX_RETRIES = 1;

function isNetworkError(err: any) {
  if (!err) return false;
  if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') return true;
  if (err.message && (err.message === 'Network Error' || err.message.includes('access control'))) return true;
  if (!err.response && err.request) return true; // connection lost / no response
  return false;
}

function clearAdminSessionAndGoToLogin(configUrl?: string) {
  if (configUrl?.includes('/auth/admin/login')) return;
  if (typeof window === 'undefined') return;

  // Just-logged-in grace period: log loudly but don't yank the session.
  // The most common cause of "logged in but bounced back" is a transient
  // 401 (dev-server Fast Refresh, stale in-flight request, etc.) that
  // arrives milliseconds after the new token was written.
  if (isWithinLoginGrace()) {
    // eslint-disable-next-line no-console
    console.warn(
      `[admin-auth] Ignoring 401 within login grace period for "${configUrl}".`,
      'If this keeps happening please share this URL — the backend rejected the just-issued token.'
    );
    return;
  }

  localStorage.removeItem('adminToken');
  localStorage.removeItem(LOGIN_AT_KEY);
  // Don't fight ourselves if the user is already on the login page — that
  // creates a confusing reload loop right after they enter credentials.
  const path = window.location.pathname || '';
  if (path === '/admin/login' || path.startsWith('/admin/login')) return;

  // Use Next-friendly soft redirect when possible; window.location.replace
  // as a fallback. Either way, log the URL that caused the bounce so the
  // user can tell us if this happens again.
  // eslint-disable-next-line no-console
  console.warn(`[admin-auth] 401 on "${configUrl}" — clearing session and redirecting to /admin/login`);
  window.location.replace('/admin/login');
}

// Retry once on network/connection failure (e.g. backend cold start on Render)
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const retryCount = config?.__retryCount ?? 0;
    if (isNetworkError(error) && config && retryCount < MAX_RETRIES) {
      config.__retryCount = retryCount + 1;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return adminApi.request(config);
    }
    if (error.response?.status === 401) {
      clearAdminSessionAndGoToLogin(config?.url);
    }
    return Promise.reject(error);
  }
);

uploadApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAdminSessionAndGoToLogin(error.config?.url);
    }
    return Promise.reject(error);
  }
);

export function markAdminLoggedInNow() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOGIN_AT_KEY, String(Date.now()));
}

// POS API helpers
export const posApi = {
  searchProducts: (query: string, type: string) =>
    adminApi.get(`/pos/products/search?q=${encodeURIComponent(query)}&type=${type}`),
  createSale: (data: any) => adminApi.post('/pos/sale', data),
  getSales: (params?: any) => adminApi.get('/pos/sales', { params }),
  getSale: (id: string) => adminApi.get(`/pos/sales/${id}`),
};

export default adminApi;
