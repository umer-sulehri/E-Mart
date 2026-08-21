'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/common/AuthLayout';
import { apiFetch } from '@/lib/api/client';

type Step = 'request' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address'); return; }
    setError('');
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identifier: email }) });
      setStep('reset');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError('Please enter the reset code'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ identifier: email, code, newPassword }) });
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <AuthLayout title="Password Reset!">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(110,139,94,0.15)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--color-success)' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Your password has been reset successfully.</p>
          <Link href="/login" className="inline-block w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (step === 'reset') {
    return (
      <AuthLayout title="Reset Password" maxWidth="500px">
        <p className="text-center text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          Enter the code sent to <strong>{email}</strong> and your new password.
        </p>
        {error && (
          <div className="mb-5 p-3 rounded-lg text-center text-sm" style={{ color: 'var(--color-error)', background: 'rgba(182,92,75,0.1)', border: '1px solid var(--color-error)' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Reset Code</label>
            <input type="text" value={code} onChange={(e) => { setCode(e.target.value); setError(''); }} placeholder="Enter 6-digit code" maxLength={6} className="w-full px-4 py-3.5 rounded-[10px] text-[15px] transition-all duration-300 bg-white focus:outline-none text-center tracking-[0.5em] text-lg font-mono" style={{ border: '2px solid var(--color-border)' }} onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }} />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(''); }} placeholder="Enter new password" className="w-full px-4 py-3.5 rounded-[10px] text-[15px] transition-all duration-300 bg-white focus:outline-none" style={{ border: '2px solid var(--color-border)' }} onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }} />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }} placeholder="Confirm new password" className="w-full px-4 py-3.5 rounded-[10px] text-[15px] transition-all duration-300 bg-white focus:outline-none" style={{ border: '2px solid var(--color-border)' }} onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 mt-2 disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Resetting...
              </span>
            ) : 'Reset Password'}
          </button>
        </form>
        <div className="text-center mt-5">
          <button onClick={() => { setStep('request'); setError(''); }} className="text-sm font-semibold" style={{ color: 'var(--color-primary-dark)' }}>
            ← Use a different email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot Password?" maxWidth="500px">
      <p className="text-center text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        Enter your email address and we&apos;ll send you a code to reset your password.
      </p>
      {error && (
        <div className="mb-5 p-3 rounded-lg text-center text-sm" style={{ color: 'var(--color-error)', background: 'rgba(182,92,75,0.1)', border: '1px solid var(--color-error)' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleRequest} className="flex flex-col gap-5">
        <div>
          <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Email Address</label>
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="Enter your registered email" className="w-full px-4 py-3.5 rounded-[10px] text-[15px] transition-all duration-300 bg-white focus:outline-none" style={{ border: '2px solid var(--color-border)' }} onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }} autoComplete="email" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 mt-2.5 disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : 'Send Reset Code'}
        </button>
      </form>
      <div className="text-center mt-5">
        <Link href="/login" className="text-sm font-semibold" style={{ color: 'var(--color-primary-dark)' }}>Back to Login</Link>
      </div>
    </AuthLayout>
  );
}
