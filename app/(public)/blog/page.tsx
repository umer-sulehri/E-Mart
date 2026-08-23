'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useTranslations } from '@/hooks/useTranslations';
import { ClockIcon, ArrowRightIcon } from '@/components/icons';
import type { BlogPost } from '@/lib/types';

export default function BlogPage() {
  const { t } = useTranslations();
  const { data: posts = [] } = useBlogPosts();
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(posts.map((p) => p.category)))],
    [posts],
  );

  const filtered = activeCategory === 'All'
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
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
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
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

      {/* Featured Post */}
      {filtered.length > 0 && (
        <Link href={`/blog/${filtered[0].slug}`} className="block mb-10">
          <article className="bg-surface border border-border rounded-[16px] overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden">
                <img
                  src={filtered[0].coverImage}
                  alt={filtered[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute top-4 left-4 bg-accent text-text-inverse text-xs font-bold px-3 py-1 rounded-full">
                  Featured
                </span>
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-primary/10 text-primary-dark text-xs font-semibold px-3 py-1 rounded-full">
                    {filtered[0].category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-text-secondary">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {filtered[0].readTime} min read
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary mb-3 group-hover:text-primary-dark transition-colors leading-tight">
                  {filtered[0].title}
                </h2>
                <p className="text-text-secondary mb-4 line-clamp-3 leading-relaxed">
                  {filtered[0].excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-dark">
                      {filtered[0].author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{filtered[0].author}</p>
                      <p className="text-xs text-text-secondary">
                        {new Date(filtered[0].publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
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

      {/* Blog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.slice(1).map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-secondary text-lg">No blog posts found in this category.</p>
        </div>
      )}
    </div>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
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
            <span className="text-xs text-text-secondary">
              {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary-dark transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>
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
            <span className="flex items-center gap-1 text-sm font-semibold text-primary-dark">
              Read More <ArrowRightIcon className="w-4 h-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
