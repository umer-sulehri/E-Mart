'use client';

import Link from 'next/link';
import { ClockIcon, ArrowRightIcon } from '@/components/icons';
import type { BlogPost } from '@/lib/types';

/** "Aug 24, 2026" — shared by the blog listing and detail pages. */
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface BlogCardProps {
  post: BlogPost;
  /** Heading level of the title inside the card. */
  headingLevel?: 'h2' | 'h3';
  /** Label for the call-to-action (i18n-aware). */
  readMoreLabel?: string;
}

export function BlogCard({ post, headingLevel: Title = 'h3', readMoreLabel = 'Read More' }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="block h-full">
      <article className="bg-surface border border-border rounded-[16px] overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-full">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <span className="absolute top-3 left-3 bg-primary/90 text-text-inverse text-xs font-semibold px-3 py-1 rounded-full">
            {post.category}
          </span>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <ClockIcon className="w-3.5 h-3.5" />
              {post.readTime} min read
            </span>
            <span className="text-xs text-text-secondary">{formatPostDate(post.publishedAt)}</span>
          </div>

          <Title className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary-dark transition-colors leading-snug line-clamp-2">
            {post.title}
          </Title>
          <p className="text-sm text-text-secondary mb-4 line-clamp-2 flex-1 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-dark">
                {post.author.charAt(0)}
              </div>
              <span className="text-xs font-medium text-text-secondary">{post.author}</span>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-primary-dark group-hover:gap-2 transition-all">
              {readMoreLabel} <ArrowRightIcon className="w-4 h-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/** Placeholder card shown while posts load (used in grids). */
export function BlogCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-[16px] overflow-hidden animate-pulse" aria-hidden="true">
      <div className="aspect-[16/10] bg-surface-alt" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-1/2 rounded bg-surface-alt" />
        <div className="h-5 w-4/5 rounded bg-surface-alt" />
        <div className="h-3 w-full rounded bg-surface-alt" />
        <div className="h-3 w-2/3 rounded bg-surface-alt" />
      </div>
    </div>
  );
}
