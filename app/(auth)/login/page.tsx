'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { useRequestOtp } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/common/AuthLayout';
import { EyeIcon, EyeOffIcon, ArrowLeftIcon } from '@/components/icons';

export default function LoginPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const requestOtp = useRequestOtp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    setError('');
    requestOtp.mutate(email.trim(), {
      onSuccess: () => {
        sessionStorage.setItem('otpIdentifier', email.trim());
        router.push('/otp-verify');
      },
      onError: (err) => {
        setError(err.message || 'Failed to send OTP. Please try again.');
      },
    });
  };

  return (
    <AuthLayout title="Login to Account">
      {error && (
        <div
          className="mb-5 p-3 rounded-lg text-center text-sm font-medium animate-[shake_0.5s_ease]"
          style={{
            color: 'var(--color-error)',
            background: 'rgba(182,92,75,0.1)',
            border: '1px solid var(--color-error)',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email */}
        <div>
          <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="Enter your email"
            className="w-full px-4 py-3.5 rounded-[10px] text-[15px] transition-all duration-300 bg-white focus:outline-none"
            style={{ border: '2px solid var(--color-border)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter your password"
              className="w-full px-4 pr-14 py-3.5 rounded-[10px] text-[15px] transition-all duration-300 bg-white focus:outline-none"
              style={{ border: '2px solid var(--color-border)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(122,155,118,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Forgot Password */}
        <div className="text-right">
          <Link href="/forgot-password" className="text-[13px] font-semibold" style={{ color: 'var(--color-primary-dark)' }}>
            Forgot Password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={requestOtp.isPending}
          className="w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 mt-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
        >
          {requestOtp.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending OTP...
            </span>
          ) : 'Login'}
        </button>
      </form>

      {/* Register Link */}
      <p className="text-center mt-5 text-sm" style={{ color: 'var(--color-text-primary)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold" style={{ color: 'var(--color-primary-dark)' }}>
          Register here
        </Link>
      </p>

      {/* Back to Home */}
      <div className="text-center mt-4">
        <Link
          href="/"
          className="inline-block px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          Back to Homepage
        </Link>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </AuthLayout>
  );
}
