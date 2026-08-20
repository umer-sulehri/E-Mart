import { ReactNode } from 'react';

interface IconProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  label: string;
  className?: string;
}

export function Icon({ children, size = 'md', label, className = '' }: IconProps) {
  const sizes: Record<string, string> = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <span className={`inline-flex items-center justify-center ${sizes[size]} ${className}`} role="img" aria-label={label}>
      {children}
    </span>
  );
}

interface IconButtonProps {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'primary' | 'secondary';
  className?: string;
  badge?: number;
}

export function IconButton({ children, label, onClick, size = 'md', variant = 'ghost', className = '', badge }: IconButtonProps) {
  const sizes: Record<string, string> = {
    sm: 'w-8 h-8',
    md: 'min-w-[48px] min-h-[48px] w-12 h-12',
    lg: 'w-14 h-14',
  };

  const variants: Record<string, string> = {
    ghost: 'hover:bg-surface text-text-primary',
    primary: 'bg-primary text-text-inverse hover:bg-primary-dark',
    secondary: 'bg-secondary text-text-primary hover:opacity-90',
  };

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${sizes[size]} ${variants[variant]} relative ${className}`}
    >
      {children}
      {typeof badge === 'number' && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-accent text-text-inverse text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1" aria-hidden="true">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}
