'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-[12px] transition-all duration-200 min-h-[48px] min-w-[48px] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

  const variants: Record<string, string> = {
    primary: 'bg-primary text-text-inverse hover:bg-primary-dark focus-visible:outline-primary',
    secondary: 'bg-secondary text-text-primary hover:opacity-90',
    outline: 'border-2 border-border text-text-primary bg-transparent hover:bg-surface',
    ghost: 'text-text-primary hover:bg-surface',
    danger: 'bg-error text-text-inverse hover:opacity-90',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-5 py-3 text-base gap-2',
    lg: 'px-6 py-4 text-lg gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
