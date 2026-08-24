'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useTranslations } from '@/hooks/useTranslations';
import { ClockIcon, ArrowRightIcon, SearchIcon, CloseIcon } from '@/components/icons';
import { BlogCard, BlogCardSkeleton, formatPostDate } from '@/components/blog/BlogCard';

export default function BlogPage() {
  const { t } = useTranslations();
  const { data: posts = [], isLoading } = useBlogPosts();
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(posts.map((p) => p.category)))],
    [posts],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [posts, activeCategory, query]);

  // The hero treatment only pays off on unfiltered browsing.
  const featured = query.trim() === '' ? filtered[0] : undefined;
  const gridPosts = featured ? filtered.slice(1) : filtered;

  const clearFilters = () => {
    setQuery('');
    setActiveCategory('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ================= Header ================= */}
      <header className="mb-10">
        <nav className="text-sm mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-text-secondary">
            <li><Link href="/" className="hover:text-primary-dark transition-colors">Home</Link></li>
            <li aria-hidden="true" className="text-border">/</li>
            <li className="text-text-primary font-medium">Blog</li>
          </ol>
        </nav>
        <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-3">{t('home.blog.title')}</h1>
        <p className="text-text-secondary text-lg max-w-2xl">
          Tips, recipes, and guides to help you make the most of your everyday shopping and lifestyle.
        </p>
      </header>

      {/* ================= Search & Category filter ================= */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
        <div className="relative w-full md:max-w-sm">
          <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="w-full h-[48px] pl-11 pr-10 rounded-[12px] bg-surface border border-border text-text-primary text-sm focus:outline-none focus:border-primary transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-alt"
              aria-label="Clear search"
            >
              <CloseIcon className="w-4 h-4 text-text-secondary" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Filter by category">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors min-h-[48px] whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-primary text-text-inverse'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-alt'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ================= Loading ================= */}
      {isLoading && (
        <div className="space-y-8" role="status" aria-label="Loading blog posts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-[16/10] rounded-[16px] bg-surface-alt animate-pulse" />
            <div className="space-y-3 pt-1">
              <div className="h-4 w-24 rounded bg-surface-alt animate-pulse" />
              <div className="h-8 w-5/6 rounded bg-surface-alt animate-pulse" />
              <div className="h-4 w-full rounded bg-surface-alt animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-surface-alt animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* ================= Empty states ================= */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-[16px]">
          <p className="text-text-secondary text-lg">No articles have been published yet.</p>
          <p className="text-text-secondary text-sm mt-1">Check back soon — fresh content is on the way.</p>
        </div>
      )}

      {!isLoading && posts.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-[16px]">
          <p className="text-text-primary font-semibold text-lg mb-1">No matching articles</p>
          <p className="text-text-secondary text-sm mb-5">
            Nothing found for “{query.trim()}”
            {activeCategory !== 'All' ? <> in <strong>{activeCategory}</strong></> : null}.
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center justify-center h-[48px] px-6 bg-primary text-text-inverse font-semibold rounded-[12px] hover:bg-primary-dark transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ================= Featured article ================= */}
      {!isLoading && featured && (
        <Link href={`/blog/${featured.slug}`} className="block mb-10 group">
          <article className="bg-surface border border-border rounded-[16px] overflow-hidden hover:shadow-lg transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden">
                <img
                  src={featured.coverImage}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-accent text-text-inverse text-xs font-bold px-3 py-1 rounded-full">
                  Featured
                </span>
              </div>

              <div className="p-6 md:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-primary/10 text-primary-dark text-xs font-semibold px-3 py-1 rounded-full">
                    {featured.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-text-secondary">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {featured.readTime} min read
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary mb-3 group-hover:text-primary-dark transition-colors leading-tight">
                  {featured.title}
                </h2>
                <p className="text-text-secondary mb-4 line-clamp-3 leading-relaxed">
                  {featured.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-dark">
                      {featured.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{featured.author}</p>
                      <p className="text-xs text-text-secondary">{formatPostDate(featured.publishedAt)}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary-dark group-hover:gap-2 transition-all">
                    {t('home.blog.readMore')} <ArrowRightIcon className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </article>
        </Link>
      )}

      {/* ================= Article grid ================= */}
      {!isLoading && gridPosts.length > 0 && (
        <>
          <p className="text-sm text-text-secondary mb-4" role="status">
            Showing {gridPosts.length} article{gridPosts.length === 1 ? '' : 's'}
            {activeCategory !== 'All' ? <> in <strong>{activeCategory}</strong></> : null}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridPosts.map((post) => (
              <BlogCard key={post.id} post={post} readMoreLabel={t('home.blog.readMore')} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
