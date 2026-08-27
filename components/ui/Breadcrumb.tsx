import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-sm text-muted-600',
        className
      )}
      aria-label="Breadcrumb"
    >
      <Link
        href="/"
        className="flex items-center gap-1 text-muted-600 transition-colors hover:text-primary"
      >
        <Home size={14} />
        Home
      </Link>

      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-muted-400" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted-600 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-secondary-800">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
