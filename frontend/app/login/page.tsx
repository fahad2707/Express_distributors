'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email && !phone) {
        toast.error('Enter email or phone');
        return;
      }
      const response = await api.post('/auth/login', {
        email: email || undefined,
        phone: phone || undefined,
        password,
      });
      setAuth(response.data.user, response.data.token);
      toast.success('Login successful!');

      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (!email && !phone) {
        toast.error('Enter email or phone');
        return;
      }
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
      const response = await api.post('/auth/register', {
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        password,
      });
      if (response.data.requiresVerification) {
        toast.success(response.data.message || 'Check your email to verify your account.');
        setMode('login');
        return;
      }
      setAuth(response.data.user, response.data.token);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1115] px-4">
      <div className="glass-panel max-w-md w-full px-8 py-8 md:px-10 md:py-10">
        <h1 className="gradient-heading text-xl md:text-2xl text-center mb-6">
          {isLogin ? 'Customer Access' : 'Create your account'}
        </h1>

        <div className="flex items-center justify-center gap-2 mb-8 text-xs md:text-sm">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`px-4 py-2 rounded-full transition-all ${
              isLogin ? 'glass-button glass-button-gradient text-white' : 'bg-white/5 text-slate-200'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`px-4 py-2 rounded-full transition-all ${
              !isLogin ? 'glass-button glass-button-gradient text-white' : 'bg-white/5 text-slate-200'
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7c5cff]"
                placeholder="Your name"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7c5cff]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7c5cff]"
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7c5cff]"
              placeholder="At least 8 characters"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7c5cff]"
                placeholder="Repeat password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button glass-button-gradient text-white py-3 rounded-lg font-semibold transition-all hover:scale-[1.03] disabled:opacity-50"
          >
            {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : isLogin ? 'Login' : 'Sign up'}
          </button>

          {isLogin && (
            <p className="text-center text-sm text-slate-400">
              <Link href="/forgot-password" className="text-[#7c5cff] hover:underline">
                Forgot password?
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

