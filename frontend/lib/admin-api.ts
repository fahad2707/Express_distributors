import axios from 'axios';
import { resolveApiBaseUrl } from './api-base-url';

const adminApi = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

export const uploadApi = axios.create({
  timeout: 60000,
});

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
      // Axios/fetch require scheme. Users often paste env without https://.
      if (!/^https?:\/\//i.test(d)) {
        if (/^(localhost|127\.0\.0\.1)(:|$)/i.test(d)) d = `http://${d}`;
        else d = `https://${d}`;
      }
      // Ensure we end at ".../api" since axios call is "/products/..."
      if (!/\/api\/?$/i.test(d)) d = `${d}/api`;
      config.baseURL = d;
    }
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
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
  localStorage.removeItem('adminToken');
  window.location.href = '/admin/login';
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

// POS API helpers
export const posApi = {
  searchProducts: (query: string, type: string) =>
    adminApi.get(`/pos/products/search?q=${encodeURIComponent(query)}&type=${type}`),
  createSale: (data: any) => adminApi.post('/pos/sale', data),
  getSales: (params?: any) => adminApi.get('/pos/sales', { params }),
  getSale: (id: string) => adminApi.get(`/pos/sales/${id}`),
};

export default adminApi;
