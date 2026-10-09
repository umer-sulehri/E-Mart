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

/**
 * Breadcrumb trail: `Home` is always the first crumb, then `items`.
 *
 * The segments are inline, not flex items. As flex children each segment was an
 * atomic box, so a long product name wrapped *inside* its own box and the
 * chevron — vertically centred against it — ended up floating beside the middle
 * of the text instead of on its first line. In an inline flow the chevron is
 * part of the line box, so it stays with the first line however the label wraps.
 */
export default function Breadcrumb({ items, className, activeItemClassName }: BreadcrumbProps) {
  return (
    <nav
      className={cn('text-sm text-muted-600', className)}
      aria-label="Breadcrumb"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 align-middle transition-colors hover:text-primary"
      >
        <Home size={14} className="shrink-0 align-middle" aria-hidden="true" />
        Home
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="inline">
            <ChevronRight
              size={12}
              className="mx-1.5 inline-block align-middle text-muted-400"
              aria-hidden="true"
            />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-primary"
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
