'use client';

import { useState } from 'react';
import Link from 'next/link';

const API = typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api');

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessage(data.message || 'If an account exists for that email, a reset link was sent.');
    } catch (err: any) {
      setMessage(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f1115]">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 glass-panel p-8">
        <h1 className="text-xl font-semibold text-slate-50 text-center">Reset password</h1>
        <p className="text-sm text-slate-400 text-center">
          Enter your email. If an account exists, we&apos;ll send a link (SMTP must be configured on the server).
        </p>
        {message && <p className="text-sm text-slate-300 text-center">{message}</p>}
        <div>
          <label className="block text-sm text-slate-200 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-50"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full glass-button glass-button-gradient text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send reset link'}
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
