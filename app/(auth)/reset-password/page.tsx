'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthLayout } from '@/components/common/AuthLayout';
import { EyeIcon, EyeOffIcon, CheckIcon, CloseIcon } from '@/components/icons';

function PasswordRequirement({ label, met }: { label: string; met: boolean }) {
  return (
    <li className={`text-[11px] flex items-center gap-1.5 transition-colors duration-300 ${met ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]'}`}>
      {met ? <CheckIcon className="w-3 h-3" /> : <CloseIcon className="w-3 h-3" />}
      {label}
    </li>
  );
}

type Phase = 'checking' | 'form' | 'invalid' | 'success';

/**
 * Landing target of Supabase's password-recovery email. The browser client
 * exchanges the token in the URL on load; once a recovery session exists the
 * user picks a new password via updateUser().
 */
export default function ResetPasswordPage() {
  const [phase, setPhase] = useState<Phase>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // The recovery event fires asynchronously after client init — guard
  // against marking the link invalid before it has had a chance to arrive.
  const settled = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const markValid = () => {
      if (!settled.current) {
        settled.current = true;
        setPhase('form');
      }
    };
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') markValid();
    });
    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) markValid();
      else setTimeout(() => { if (!settled.current) setPhase('invalid'); }, 1500);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Object.values(passwordChecks).every(Boolean)) {
      setError('Password does not meet all requirements'); return;
    }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setPhase('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update your password');
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'checking') {
    return (
      <AuthLayout title="Reset Password" maxWidth="500px">
        <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Verifying your reset link…
        </p>
      </AuthLayout>
    );
  }

  if (phase === 'invalid') {
    return (
      <AuthLayout title="Link Expired" maxWidth="500px">
        <div className="text-center">
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            This password reset link is invalid or has expired. Request a fresh one and try again.
          </p>
          <Link href="/forgot-password" className="inline-block w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            Request a New Link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (phase === 'success') {
    return (
      <AuthLayout title="Password Updated!">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(110,139,94,0.15)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--color-success)' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Your password has been updated successfully.</p>
          <Link href="/login" className="inline-block w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a New Password" maxWidth="500px">
      {error && (
        <div className="mb-5 p-3 rounded-lg text-center text-sm" style={{ color: 'var(--color-error)', background: 'rgba(182,92,75,0.1)', border: '1px solid var(--color-error)' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter new password"
              className="w-full px-4 pr-12 py-3.5 rounded-[10px] text-[15px] transition-all duration-300 bg-white focus:outline-none"
              style={{ border: '2px solid var(--color-border)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <ul className="mt-2 space-y-1">
              <PasswordRequirement label="At least 8 characters" met={passwordChecks.length} />
              <PasswordRequirement label="At least 1 uppercase letter (A-Z)" met={passwordChecks.upper} />
              <PasswordRequirement label="At least 1 lowercase letter (a-z)" met={passwordChecks.lower} />
              <PasswordRequirement label="At least 1 number (0-9)" met={passwordChecks.number} />
            </ul>
          )}
        </div>
        <div>
          <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
            placeholder="Confirm new password"
            className="w-full px-4 py-3.5 rounded-[10px] text-[15px] transition-all duration-300 bg-white focus:outline-none"
            style={{ border: '2px solid var(--color-border)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 mt-2 disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Updating...
            </span>
          ) : 'Update Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
