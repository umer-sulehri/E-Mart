'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/common/AuthLayout';
import { apiFetch } from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address'); return; }
    setError('');
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send the reset link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check Your Email" maxWidth="500px">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(110,139,94,0.15)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--color-primary-dark)' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            If an account exists for <strong>{email}</strong>, a password reset link is on its way.
            Open the link in this browser to choose a new password.
          </p>
          <Link href="/login" className="inline-block w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot Password?" maxWidth="500px">
      <p className="text-center text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>
      {error && (
        <div className="mb-5 p-3 rounded-lg text-center text-sm" style={{ color: 'var(--color-error)', background: 'rgba(182,92,75,0.1)', border: '1px solid var(--color-error)' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleRequest} className="flex flex-col gap-5">
        <div>
          <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Email Address</label>
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="Enter your registered email" className="w-full px-4 py-3.5 rounded-[10px] text-[15px] transition-all duration-300 bg-white focus:outline-none" style={{ border: '2px solid var(--color-border)' }} onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,196,63,0.2)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }} autoComplete="email" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 mt-2.5 disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : 'Send Reset Link'}
        </button>
      </form>
      <div className="text-center mt-5">
        <Link href="/login" className="text-sm font-semibold" style={{ color: 'var(--color-primary-dark)' }}>Back to Login</Link>
      </div>
    </AuthLayout>
  );
}
