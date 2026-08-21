'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { useVerifyOtp, useRequestOtp } from '@/hooks/useAuth';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/Button';
import { CheckCircleIcon } from '@/components/icons';

export default function OtpVerifyPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const verifyOtp = useVerifyOtp();
  const requestOtp = useRequestOtp();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const identifier = typeof window !== 'undefined' ? sessionStorage.getItem('otpIdentifier') : null;
  const registerName = typeof window !== 'undefined' ? sessionStorage.getItem('registerName') : null;
  const purpose: 'register' | 'reset' = registerName ? 'register' : 'reset';

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const canResend = countdown <= 0;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = pasted.split('').concat(Array(6 - pasted.length).fill(''));
    setDigits(newDigits);
    if (pasted.length > 0) {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    const id = identifier || '';
    if (!id) {
      setError('Session expired. Please login again.');
      return;
    }

    verifyOtp.mutate(
      {
        identifier: id,
        otp: code,
        purpose,
        name: registerName ?? undefined,
        userType: (sessionStorage.getItem('registerUserType') as 'customer' | 'seller') ?? undefined,
        password: sessionStorage.getItem('registerPassword') ?? undefined,
        contactPhone: sessionStorage.getItem('registerPhone') ?? undefined,
      },
      {
        onSuccess: (data) => {
          login(data.user, data.token);
          setSuccess(true);
          sessionStorage.removeItem('otpIdentifier');
          sessionStorage.removeItem('registerName');
          sessionStorage.removeItem('registerUserType');
          sessionStorage.removeItem('registerPassword');
          sessionStorage.removeItem('registerPhone');
          setTimeout(() => router.push('/'), 1500);
        },
        onError: (err) => {
          setError(err.message || 'Invalid OTP. Please try again.');
        },
      }
    );
  };

  const handleResend = () => {
    const id = identifier;
    if (!id) {
      setError('Session expired. Please go back to login.');
      return;
    }
    requestOtp.mutate(id, {
      onSuccess: () => {
        setCountdown(30);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      },
      onError: (err) => {
        setError(err.message || 'Failed to resend OTP. Please try again.');
      },
    });
  };

  if (success) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-surface border border-border rounded-[16px] p-10">
            <div className="w-20 h-20 mx-auto mb-5 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Verified!</h2>
            <p className="text-sm text-text-secondary mb-4">Your account has been verified successfully.</p>
            <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
              <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Redirecting to homepage...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex">
      {/* Left Illustration Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-success/10 relative overflow-hidden items-center justify-center">
        <div className="relative z-10 text-center px-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-success" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-text-primary mb-3">Secure Verification</h2>
          <p className="text-base text-text-secondary max-w-sm mx-auto">
            We&apos;ve sent a 6-digit verification code to your phone. Enter it below to continue.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            {['Encrypted', 'Fast', 'Reliable'].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="w-2 h-2 bg-success rounded-full" />
                {feat}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-success/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-20 w-56 h-56 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-extrabold text-primary-dark">E-Mart</h1>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">{t('auth.otp.title')}</h1>
            <p className="text-sm text-text-secondary">
              {t('auth.otp.subtitle')}
              {identifier && (
                <span className="block font-semibold text-text-primary mt-1">{identifier}</span>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
            <div className="flex gap-3 w-full justify-center" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-bg border-2 border-border rounded-[10px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-error bg-error/10 px-4 py-3 rounded-[10px] w-full text-center" role="alert">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={verifyOtp.isPending}>
              {verifyOtp.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-text-inverse/30 border-t-text-inverse rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : t('auth.otp.submit')}
            </Button>

            <div className="text-sm text-text-secondary text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={requestOtp.isPending}
                  className="font-semibold text-primary-dark hover:underline min-h-[48px] inline-flex items-center"
                >
                  {requestOtp.isPending ? 'Sending...' : t('auth.otp.resend')}
                </button>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Resend code in{' '}
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-surface rounded-full text-sm font-bold text-primary-dark border border-border">
                    {countdown}
                  </span>
                  s
                </span>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-text-secondary hover:text-primary-dark transition-colors inline-flex items-center gap-1">
              <span>←</span> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
