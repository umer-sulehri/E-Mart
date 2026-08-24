'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useTranslations } from '@/hooks/useTranslations';
import { ClockIcon, ArrowLeftIcon, ShareIcon } from '@/components/icons';
import { ArticleContent } from '@/components/blog/ArticleContent';
import { BlogCard, formatPostDate } from '@/components/blog/BlogCard';

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useTranslations();
  const { data: allPosts = [], isLoading } = useBlogPosts();
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle');

  const post = allPosts.find((p) => p.slug === slug);

  const handleShare = async () => {
    if (!post) return;
    const url = window.location.href;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: post.title, text: post.excerpt, url });
        setShareState('idle');
      } else {
        await navigator.clipboard.writeText(url);
        setShareState('copied');
        setTimeout(() => setShareState('idle'), 2500);
      }
    } catch {
      // User dismissed the share sheet â€” not an error worth surfacing.
      setShareState((s) => (s === 'copied' ? s : 'idle'));
    }
  };

  /* ================= Loading ================= */
  if (isLoading && allPosts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8" role="status" aria-label="Loading article">
        <div className="h-3 w-48 rounded bg-surface-alt animate-pulse mb-8" />
        <div className="h-4 w-24 rounded bg-surface-alt animate-pulse mb-4" />
        <div className="h-10 w-5/6 rounded bg-surface-alt animate-pulse mb-3" />
        <div className="h-10 w-2/3 rounded bg-surface-alt animate-pulse mb-6" />
        <div className="aspect-[2/1] rounded-[16px] bg-surface-alt animate-pulse mb-10" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-surface-alt animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ================= Not found ================= */
  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-surface rounded-full flex items-center justify-center">
          <span className="text-4xl" aria-hidden="true">?</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">Post Not Found</h1>
        <p className="text-text-secondary mb-6">The blog post you are looking for does not exist or has been removed.</p>
        <Link
          href="/blog"
          className="inline-flex items-center justify-center h-[48px] px-6 bg-primary text-text-inverse font-semibold rounded-[12px] hover:bg-primary-hover transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Blog
        </Link>
      </div>
    );
  }

  /* ================= Related posts ================= */
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && (p.category === post.category || p.tags.some((tag) => post.tags.includes(tag))))
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ================= Breadcrumb ================= */}
      <nav className="text-sm mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-text-secondary flex-wrap">
          <li><Link href="/" className="hover:text-primary-dark transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-border">/</li>
          <li><Link href="/blog" className="hover:text-primary-dark transition-colors">Blog</Link></li>
          <li aria-hidden="true" className="text-border">/</li>
          <li className="text-text-primary font-medium truncate max-w-[200px]" aria-current="page">{post.title}</li>
        </ol>
      </nav>

      {/* ================= Article header ================= */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-primary/10 text-primary-dark text-xs font-semibold px-3 py-1 rounded-full">
            {post.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-text-secondary">
            <ClockIcon className="w-3.5 h-3.5" />
            {post.readTime} min read
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-primary leading-tight mb-4">
          {post.title}
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed mb-6">{post.excerpt}</p>

        <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary-dark" aria-hidden="true">
              {post.author.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{post.author}</p>
              <p className="text-xs text-text-secondary">
                Published {formatPostDate(post.publishedAt)}
              </p>
            </div>
          </div>

          <button
            onClick={handleShare}
            aria-label="Share article"
            title={typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? 'Share' : 'Copy link'}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-border hover:bg-surface-alt transition-colors text-sm font-medium text-text-secondary"
          >
            <ShareIcon className="w-4 h-4" />
            {shareState === 'copied' ? 'Link copied!' : 'Share'}
          </button>
        </div>
      </header>

      {/* ================= Cover image ================= */}
      <div className="relative aspect-[2/1] rounded-[16px] overflow-hidden mb-10 border border-border">
        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
      </div>

      {/* ================= Article body ================= */}
      <article className="mb-12">
        <ArticleContent content={post.content} />
      </article>

      {/* ================= Tags ================= */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10 pb-8 border-b border-border">
          {post.tags.map((tag) => (
            <span key={tag} className="px-4 py-2 bg-surface border border-border rounded-full text-sm font-medium text-text-secondary">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ================= Back navigation ================= */}
      <div className="mb-12">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-dark hover:underline">
          <ArrowLeftIcon className="w-4 h-4" /> Back to all blog posts
        </Link>
      </div>

      {/* ================= Related posts ================= */}
      {relatedPosts.length > 0 && (
        <section aria-labelledby="related-posts-heading">
          <h2 id="related-posts-heading" className="text-2xl font-extrabold text-text-primary mb-6">
            You might also like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((rp) => (
              <BlogCard key={rp.id} post={rp} readMoreLabel={t('home.blog.readMore')} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

