'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API = typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api');

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token?.trim()) {
      setError('Invalid verification link.');
      setDone(true);
      return;
    }
    fetch(`${API}/auth/verify-email?token=${encodeURIComponent(token.trim())}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.message) setMessage(d.message);
        else setError(d.error || 'Verification failed');
      })
      .catch(() => setError('Verification failed'))
      .finally(() => setDone(true));
  }, [token]);

  if (!done) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Verifying…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0f1115] text-slate-100">
      {message ? (
        <>
          <p className="text-lg mb-4">{message}</p>
          <Link href="/login" className="text-[#7c5cff] hover:underline">
            Sign in
          </Link>
        </>
      ) : (
        <>
          <p className="text-lg mb-4 text-red-300">{error}</p>
          <Link href="/login" className="text-[#7c5cff] hover:underline">
            Back to login
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Loading…</div>}>
      <VerifyContent />
    </Suspense>
  );
}
