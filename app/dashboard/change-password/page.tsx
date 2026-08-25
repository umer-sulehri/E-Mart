'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Check, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Requirement {
  label: string;
  test: (pw: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'At least one uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least one lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'At least one number', test: (pw) => /\d/.test(pw) },
  {
    label: 'At least one special character',
    test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw),
  },
];

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => {
    return requirements.filter((r) => r.test(newPassword)).length;
  }, [newPassword]);

  const strengthColor =
    strength <= 2 ? 'bg-danger' : strength <= 3 ? 'bg-warning' : 'bg-success';

  const strengthLabel =
    strength <= 2 ? 'Weak' : strength <= 3 ? 'Fair' : strength === 4 ? 'Good' : 'Strong';

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleUpdate = async () => {
    if (!currentPassword || strength < 3 || !passwordsMatch) return;

    try {
      setLoading(true);
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Failed to update password');
      }
    } catch {
      toast.error('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/dashboard/profile"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-600 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </Link>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-secondary-800">Change Password</h2>
        <p className="mt-1 text-sm text-muted-500">
          Ensure your account stays secure with a strong password.
        </p>

        <div className="mt-6 space-y-5">
          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-lg border border-muted-200 bg-white py-2.5 pl-3.5 pr-11 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400 hover:text-muted-600"
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-lg border border-muted-200 bg-white py-2.5 pl-3.5 pr-11 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400 hover:text-muted-600"
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {newPassword.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted-500">Password strength</span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      strength <= 2
                        ? 'text-danger'
                        : strength <= 3
                        ? 'text-warning'
                        : 'text-success'
                    )}
                  >
                    {strengthLabel}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted-200">
                  <div
                    className={cn('h-full rounded-full transition-all', strengthColor)}
                    style={{ width: `${(strength / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-3 space-y-1.5">
              {requirements.map((req) => {
                const met = req.test(newPassword);
                return (
                  <div key={req.label} className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full',
                        met ? 'bg-success text-white' : 'bg-muted-200'
                      )}
                    >
                      {met && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <span
                      className={cn(
                        'text-xs',
                        met ? 'text-success' : 'text-muted-500'
                      )}
                    >
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={cn(
                  'w-full rounded-lg border bg-white py-2.5 pl-3.5 pr-11 text-sm text-secondary-800 placeholder:text-muted-400 focus:outline-none focus:ring-2',
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-success focus:border-success focus:ring-success/20'
                      : 'border-danger focus:border-danger focus:ring-danger/20'
                    : 'border-muted-200 focus:border-primary focus:ring-primary/20'
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400 hover:text-muted-600"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-danger">Passwords do not match</p>
            )}
            {passwordsMatch && (
              <p className="mt-1 text-xs text-success">Passwords match</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="primary"
            loading={loading}
            disabled={
              !currentPassword ||
              strength < 3 ||
              !passwordsMatch
            }
            onClick={handleUpdate}
          >
            Update Password
          </Button>
          <Link href="/dashboard/profile">
            <Button variant="ghost">Cancel</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
