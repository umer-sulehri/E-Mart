'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { useRequestOtp } from '@/hooks/useAuth';
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

export default function RegisterPage() {
  const router = useRouter();
  const requestOtp = useRequestOtp();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'customer' | 'seller'>('customer');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordChecks = useMemo(() => ({
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password]);

  const passwordStrength = useMemo(() => {
    const score = Object.values(passwordChecks).filter(Boolean).length;
    if (score >= 5) return { label: 'Strong', color: 'var(--color-success)' };
    if (score >= 3) return { label: 'Medium', color: '#ffc107' };
    if (score >= 1) return { label: 'Weak', color: 'var(--color-error)' };
    return { label: '', color: '' };
  }, [passwordChecks]);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (!Object.values(passwordChecks).every(Boolean)) newErrors.password = 'Password does not meet all requirements';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    requestOtp.mutate(email.trim(), {
      onSuccess: () => {
        sessionStorage.setItem('otpIdentifier', email.trim());
        sessionStorage.setItem('registerName', fullName.trim());
        sessionStorage.setItem('registerUserType', userType);
        sessionStorage.setItem('registerPassword', password);
        sessionStorage.setItem('registerPhone', phone.trim());
        router.push('/otp-verify');
      },
      onError: (err) => {
        setErrors({ general: err.message || 'Failed to send OTP. Please try again.' });
      },
    });
  };

  return (
    <AuthLayout title="Create Account" maxWidth="500px">
      {errors.general && (
        <div className="mb-5 p-3 rounded-lg text-center text-sm" style={{ color: 'var(--color-error)', background: 'rgba(182,92,75,0.1)', border: '1px solid var(--color-error)' }}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full Name */}
        <div>
          <label className="block mb-1.5 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Full Name <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: '' })); }}
            placeholder="Ahmed Khan"
            className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 bg-white focus:outline-none"
            style={{ border: errors.fullName ? '2px solid var(--color-error)' : '1px solid var(--color-border)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = errors.fullName ? 'var(--color-error)' : 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {errors.fullName && <p className="text-xs text-[var(--color-error)] mt-1">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1.5 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Email <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 bg-white focus:outline-none"
            style={{ border: errors.email ? '2px solid var(--color-error)' : '1px solid var(--color-border)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? 'var(--color-error)' : 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {errors.email && <p className="text-xs text-[var(--color-error)] mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1.5 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Password <span className="text-[var(--color-error)]">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
              placeholder="Create a password"
              className="w-full px-4 pr-12 py-3 rounded-lg text-sm transition-all duration-300 bg-white focus:outline-none"
              style={{ border: errors.password ? '2px solid var(--color-error)' : '1px solid var(--color-border)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.password ? 'var(--color-error)' : 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-all"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>

          {password && (
            <div className="mt-2 p-3 rounded-lg" style={{ background: '#f8f9fa', borderLeft: '3px solid var(--color-primary)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Password must contain:</p>
              <ul className="space-y-1">
                <PasswordRequirement label="At least 6 characters" met={passwordChecks.length} />
                <PasswordRequirement label="At least 1 uppercase letter (A-Z)" met={passwordChecks.upper} />
                <PasswordRequirement label="At least 1 lowercase letter (a-z)" met={passwordChecks.lower} />
                <PasswordRequirement label="At least 1 number (0-9)" met={passwordChecks.number} />
                <PasswordRequirement label="At least 1 special character (!@#$%^&*)" met={passwordChecks.special} />
              </ul>
              {passwordStrength.label && (
                <p className="mt-2 text-xs" style={{ color: passwordStrength.color }}>
                  Password strength: <span className="font-semibold">{passwordStrength.label}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block mb-1.5 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Confirm Password <span className="text-[var(--color-error)]">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
              placeholder="Confirm your password"
              className="w-full px-4 pr-12 py-3 rounded-lg text-sm transition-all duration-300 bg-white focus:outline-none"
              style={{ border: errors.confirmPassword ? '2px solid var(--color-error)' : '1px solid var(--color-border)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.confirmPassword ? 'var(--color-error)' : 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-all"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
          {passwordsMatch && <p className="text-xs mt-1" style={{ color: 'var(--color-success)' }}>Passwords match</p>}
          {passwordsMismatch && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>Passwords do not match</p>}
        </div>

        {/* User Type Toggle */}
        <div>
          <label className="block mb-1.5 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Register as <span className="text-[var(--color-error)]">*</span>
          </label>
          <div className="flex gap-3 mt-1">
            {[
              { value: 'customer' as const, label: '🛒 Buyer' },
              { value: 'seller' as const, label: '📦 Seller' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUserType(opt.value)}
                className="flex-1 py-3 text-center rounded-lg text-sm font-semibold transition-all duration-300 border-2"
                style={
                  userType === opt.value
                    ? { background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', borderColor: 'var(--color-primary-dark)', color: 'white' }
                    : { background: 'var(--color-surface)', borderColor: 'transparent', color: 'var(--color-text-secondary)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block mb-1.5 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g., 0300-1234567"
            className="w-full px-4 py-3 rounded-lg text-sm transition-all duration-300 bg-white focus:outline-none"
            style={{ border: '1px solid var(--color-border)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <small className="text-[11px] text-[var(--color-text-secondary)] mt-1 block">Optional but recommended for order updates.</small>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={requestOtp.isPending}
          className="w-full py-3.5 rounded-lg text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
        >
          {requestOtp.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating Account...
            </span>
          ) : 'Create Account'}
        </button>
      </form>

      <p className="text-center mt-5 text-sm" style={{ color: 'var(--color-text-primary)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-semibold" style={{ color: 'var(--color-primary-dark)' }}>
          Login here
        </Link>
      </p>

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
