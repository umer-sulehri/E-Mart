'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send reset link');
      }

      setSentEmail(data.email);
      setIsEmailSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-secondary">Check Your Email</h1>
        <p className="mt-2 text-sm text-muted-500">
          We&apos;ve sent a password reset link to{' '}
          <span className="font-medium text-secondary-800">{sentEmail}</span>
        </p>
        <p className="mt-1 text-sm text-muted-400">
          Didn&apos;t receive the email? Check your spam folder or{' '}
          <button
            onClick={() => {
              setIsEmailSent(false);
              setSentEmail('');
            }}
            className="font-medium text-primary hover:text-primary-500"
          >
            try again
          </button>
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-500">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold font-heading text-secondary">Forgot Password?</h1>
        <p className="text-sm text-muted-500">Enter your email to receive a reset link</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" loading={isLoading} className="w-full" size="lg">
          Send Reset Link
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary-500 w-full"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </Link>
    </>
  );
}
