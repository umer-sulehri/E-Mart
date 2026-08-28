'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, Store, ShoppingBag } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@/lib/validators';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { signInWithOAuth } from '@/lib/auth/oauth';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function getStrengthLabel(score: number) {
  if (score <= 2) return { label: 'Weak', color: 'bg-danger' };
  if (score <= 3) return { label: 'Medium', color: 'bg-warning' };
  return { label: 'Strong', color: 'bg-success' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'customer' | 'seller'>('customer');
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false as unknown as true,
      role: 'customer',
    },
  });

  const passwordValue = watch('password');
  const strengthScore = useMemo(() => getPasswordStrength(passwordValue || ''), [passwordValue]);
  const strength = getStrengthLabel(strengthScore);

  const selectRole = (r: 'customer' | 'seller') => {
    setRole(r);
    setValue('role', r);
  };

  const dashboardForRole = (r: 'customer' | 'seller') =>
    r === 'seller' ? '/seller' : '/dashboard';

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      const dashboardPath = dashboardForRole(data.role);
      toast.success('Account created!');

      if (result.data?.user) {
        login(result.data.user);
      }

      setTimeout(() => {
        router.push(dashboardPath);
      }, 800);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold font-heading text-secondary">Create Account</h1>
        <p className="text-sm text-muted-500">Join E-Mart for fresh organic groceries</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary">
            I want to register as
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => selectRole('customer')}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-all',
                role === 'customer'
                  ? 'border-primary bg-primary-50 text-primary-700'
                  : 'border-muted-200 text-muted-500 hover:border-primary-300'
              )}
              aria-pressed={role === 'customer'}
            >
              <ShoppingBag className="h-6 w-6" />
              <span className="text-sm font-semibold">Buyer</span>
              <span className="text-xs text-muted-400">Shop organic groceries</span>
            </button>
            <button
              type="button"
              onClick={() => selectRole('seller')}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-all',
                role === 'seller'
                  ? 'border-primary bg-primary-50 text-primary-700'
                  : 'border-muted-200 text-muted-500 hover:border-primary-300'
              )}
              aria-pressed={role === 'seller'}
            >
              <Store className="h-6 w-6" />
              <span className="text-sm font-semibold">Seller</span>
              <span className="text-xs text-muted-400">Open your own store</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            placeholder="John"
            icon={<User className="h-4 w-4" />}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            icon={<User className="h-4 w-4" />}
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-muted-400 transition-colors hover:text-secondary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordValue && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= strengthScore ? strength.color : 'bg-muted-200'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-500">
                {strength.label} password
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[38px] text-muted-400 transition-colors hover:text-secondary"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <label className="flex items-start gap-2 text-sm text-muted-600">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
            {...register('agreeToTerms')}
          />
          <span>
            I agree to{' '}
            <Link href="/terms" className="font-medium text-primary hover:text-primary-500" target="_blank">
              Terms &amp; Conditions
            </Link>
          </span>
        </label>
        {errors.agreeToTerms && (
          <p className="text-xs text-danger">{errors.agreeToTerms.message}</p>
        )}

        <Button type="submit" loading={isLoading} className="w-full" size="lg">
          Create Account
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-muted-400">OR</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => signInWithOAuth('google', `/${role === 'seller' ? 'seller' : 'dashboard'}`)}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => signInWithOAuth('facebook')}
          >
            <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </Button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-muted-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:text-primary-500">
          Login
        </Link>
      </p>
    </>
  );
}
