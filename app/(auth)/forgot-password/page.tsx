'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
import { AuthLayout } from '@/components/common/AuthLayout';
import { EyeIcon, EyeOffIcon } from '@/components/icons';

type Step = 'request' | 'success';

export default function ForgotPasswordPage() {
  const { t } = useTranslations();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 1500);
  };

  if (step === 'success') {
    return (
      <AuthLayout title="Check Your Email">
        <div className="text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(110,139,94,0.15)' }}
          >
            <svg className="w-8 h-8" style={{ color: 'var(--color-success)' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </div>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
            A password reset link has been sent to:
          </p>
          <p className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {email}
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Check your inbox and click the link to reset your password. The link will expire in 1 hour.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
          >
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
        <div
          className="mb-5 p-3 rounded-lg text-center text-sm"
          style={{ color: 'var(--color-error)', background: 'rgba(182,92,75,0.1)', border: '1px solid var(--color-error)' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="Enter your registered email"
            className="w-full px-4 py-3.5 rounded-[10px] text-[15px] transition-all duration-300 bg-white focus:outline-none"
            style={{ border: '2px solid var(--color-border)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 mt-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : 'Send Reset Link'}
        </button>
      </form>

      <div className="text-center mt-5">
        <Link href="/login" className="text-sm font-semibold" style={{ color: 'var(--color-primary-dark)' }}>
          Back to Login
        </Link>
      </div>

      <div className="text-center mt-4">
        <Link
          href="/"
          className="inline-block px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          Back to Homepage
        </Link>
      </div>
    </AuthLayout>
  );
}
