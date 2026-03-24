'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API = typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api');

function ResetContent() {
  const params = useSearchParams();
  const token = params.get('token')?.trim() || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset link');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setMessage(data.message || 'Password updated.');
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0f1115] text-slate-100 gap-4">
        <p>Invalid or missing reset link.</p>
        <Link href="/login" className="text-[#7c5cff] hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  if (message) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0f1115] text-slate-100 gap-4">
        <p>{message}</p>
        <Link href="/login" className="text-[#7c5cff] hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f1115]">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 glass-panel p-8">
        <h1 className="text-xl font-semibold text-slate-50 text-center">Set a new password</h1>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <div>
          <label className="block text-sm text-slate-200 mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-50"
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-200 mb-1">Confirm</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-50"
            minLength={8}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full glass-button glass-button-gradient text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Update password'}
        </button>
        <p className="text-center text-sm">
          <Link href="/login" className="text-[#7c5cff] hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Loading…</div>}>
      <ResetContent />
    </Suspense>
  );
}
