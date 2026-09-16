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
  /** Extra classes for the final (active) non-link item. */
  activeItemClassName?: string;
}

export default function Breadcrumb({ items, className, activeItemClassName }: BreadcrumbProps) {
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

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5">
            <ChevronRight size={12} className="text-muted-400" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-muted-600 transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'font-medium text-secondary-800',
                  isLast && activeItemClassName
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
