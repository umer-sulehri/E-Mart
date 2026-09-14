'use client';

import Link from 'next/link';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const baseClasses =
  'flex flex-col items-center justify-center gap-2 p-3 sm:p-4 lg:p-5 rounded-lg transition-all duration-300 ' +
  'bg-gradient-to-b from-primary-50 to-primary-100 border border-primary-200 ' +
  'text-primary-700 hover:from-primary-100 hover:to-primary-200 hover:shadow-md hover:border-primary-300 ' +
  'active:scale-95 disabled:pointer-events-none disabled:opacity-50 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2';

const iconClasses = 'w-6 h-6 sm:w-8 sm:h-8 text-primary-600';
const labelClasses =
  'text-sm sm:text-base font-medium text-center text-primary-700';

export default function ActionButton({
  icon,
  label,
  href,
  onClick,
  disabled = false,
  loading = false,
  className,
}: ActionButtonProps) {
  const content = (
    <>
      {loading ? (
        <Loader className={cn(iconClasses, 'animate-spin')} aria-hidden="true" />
      ) : (
        icon
      )}
      <span className={labelClasses}>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={disabled ? '#' : href}
        onClick={disabled ? (e) => e.preventDefault() : onClick}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        className={cn(baseClasses, className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      className={cn(baseClasses, className)}
    >
      {content}
    </button>
  );
}