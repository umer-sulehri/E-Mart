'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Loader2, Store, ShoppingBag, Shield, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/lib/validators';
import { useAuthStore } from '@/store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { signInWithOAuth } from '@/lib/auth/oauth';
import { cn } from '@/lib/utils';

type Role = 'buyer' | 'seller' | 'admin';

const ROLE_META: Record<
  Role,
  { label: string; tagline: string; icon: typeof Store; route: string; accent: boolean }
> = {
  buyer: {
    label: 'Buyer',
    tagline: 'Shop products & manage orders',
    icon: ShoppingBag,
    route: '/dashboard',
    accent: false,
  },
  seller: {
    label: 'Seller',
    tagline: 'Manage your store & products',
    icon: Store,
    route: '/seller',
    accent: false,
  },
  admin: {
    label: 'Admin',
    tagline: 'Manage the platform',
    icon: Shield,
    route: '/admin',
    accent: true,
  },
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function RoleSelector({ onSelect, onContinue }: { onSelect: (r: Role) => void; onContinue: (r: Role) => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold font-heading text-secondary">Welcome to E-Mart</h1>
        <p className="text-sm text-muted-500">Choose how you want to sign in</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {(Object.keys(ROLE_META) as Role[]).map((role) => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          return (
            <button
              key={role}
              type="button"
              onClick={() => {
                onSelect(role);
                onContinue(role);
              }}
              className={cn(
                'group flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all',
                meta.accent
                  ? 'border-muted-200 hover:border-danger hover:bg-danger/5'
                  : 'border-muted-200 hover:border-primary hover:bg-primary-50'
              )}
              aria-label={`Login as ${meta.label}`}
            >
              <span
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors',
                  meta.accent ? 'bg-danger/10 text-danger group-hover:bg-danger group-hover:text-white' : 'bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white'
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-secondary">Login as {meta.label}</span>
                <span className="block text-xs text-muted-500">{meta.tagline}</span>
              </span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  meta.accent ? 'text-danger group-hover:text-danger' : 'text-primary'
                )}
              >
                Continue →
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-400">
        Not sure? Start as a Buyer — you can open a store anytime.
      </p>
    </div>
  );
}

function RoleLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { login } = useAuthStore();
  const [role, setRole] = useState<Role | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dashboardForRole = (r?: string) => {
    if (r === 'seller') return '/seller';
    if (r === 'admin') return '/admin';
    return '/dashboard';
  };

  // Only honor a requested redirect if the signed-in user is allowed to access
  // it. A buyer must never be pushed into a seller/admin area just because the
  // login URL carried ?redirect=/seller or ?redirect=/admin.
  const safeRedirect = (r?: string) => {
    if (!redirectTo || redirectTo === '/') return null;
    if (redirectTo.startsWith('/admin') && r !== 'admin') return null;
    if (redirectTo.startsWith('/seller') && r !== 'seller' && r !== 'admin') return null;
    if (redirectTo.startsWith('/dashboard') && r !== 'customer' && r !== 'admin') return null;
    return redirectTo;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: role === 'buyer' ? 'customer' : role,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Login failed');

      const user = result.data?.user;
      login(user);
      toast.success('Welcome back!');
      const dest = safeRedirect(user?.role) || dashboardForRole(user?.role);
      router.push(dest);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Role selector step (no role chosen yet)
  if (!role) {
    return (
      <RoleSelector
        onSelect={(r) => setRole(r)}
        onContinue={(r) => setRole(r)}
      />
    );
  }

  const meta = ROLE_META[role];

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold font-heading text-secondary">
          Login as {meta.label}
        </h1>
        <button
          type="button"
          onClick={() => setRole(null)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Change role
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
              {...register('rememberMe')}
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-500">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          loading={isLoading}
          className={cn('w-full', meta.accent && '!bg-danger hover:!bg-danger/90')}
          size="lg"
        >
          Login as {meta.label}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-muted-400">OR sign in with Google</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => signInWithOAuth('google', meta.route)}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors',
          meta.accent
            ? 'border-muted-200 text-secondary hover:border-danger'
            : 'border-muted-200 text-secondary hover:border-primary'
        )}
      >
        <GoogleIcon className="h-5 w-5" />
        Continue with Google
      </button>

      <p
        className={cn(
          'flex items-center justify-center gap-1.5 text-center text-[11px]',
          meta.accent ? 'text-danger' : 'text-muted-400'
        )}
      >
        {meta.accent ? (
          <Shield className="h-3.5 w-3.5" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        {meta.accent
          ? 'Admin access is provisioned by an administrator and only works for approved accounts.'
          : 'New Google accounts are created with the selected role.'}
      </p>

      <p className="pt-3 text-center text-sm text-muted-500">
        Don&apos;t have an account?{' '}
        <Link
          href={role === 'buyer' ? '/register' : `/register?role=${role}`}
          className={cn('font-medium hover:text-primary-500', meta.accent ? 'text-danger' : 'text-primary')}
        >
          Register as {meta.label}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <RoleLoginForm />
    </Suspense>
  );
}
