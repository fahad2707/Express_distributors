'use client';

import { useEffect, useState } from 'react';
import adminApi, { markAdminLoggedInNow } from '@/lib/admin-api';
import { formatApiError } from '@/lib/format-api-error';
import toast from 'react-hot-toast';

function readNextFromUrl(): string {
  if (typeof window === 'undefined') return '/admin/dashboard';
  try {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '';
    if (next && next.startsWith('/admin')) return next;
  } catch {
    /* ignore */
  }
  return '/admin/dashboard';
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If a valid-looking token is already stored, jump straight to the dashboard.
  // This avoids users being stuck on the login page after a Fast Refresh /
  // accidental nav while still authenticated.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('adminToken');
    if (token) {
      window.location.replace(readNextFromUrl());
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminApi.post('/auth/admin/login', { email, password });
      const token = response.data?.token as string | undefined;
      if (!token) {
        toast.error('Login response missing token. Try again.');
        setLoading(false);
        return;
      }
      // Order matters: write the token + the just-logged-in marker first so the
      // grace period in admin-api covers any 401 that races with navigation,
      // then perform a full navigation (router.push has been observed to leave
      // the page on /admin/login when redirect mechanisms collide).
      localStorage.setItem('adminToken', token);
      markAdminLoggedInNow();
      toast.success('Login successful!');
      window.location.replace(readNextFromUrl());
    } catch (error: unknown) {
      const ax = error as { code?: string; message?: string; response?: unknown };
      if (ax.code === 'ECONNREFUSED' || ax.message?.includes('Network Error') || !ax.response) {
        toast.error('Cannot reach server. Is the backend running? Start it with: npm run dev (from project root)');
      } else {
        toast.error(formatApiError(error, 'Login failed'));
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          Admin Login
        </h1>
        <p className="text-center text-gray-600 mb-8">Express Distributors Inc</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@expressdistributors.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Default: admin@edinc.com / Admin1234
        </p>
        <p className="mt-1 text-center text-xs text-gray-400">
          Production: set BACKEND_URL on Vercel to your Railway host (with or without https://).
        </p>
      </div>
    </div>
  );
}




