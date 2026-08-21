'use client';

import React from 'react';
import Link from 'next/link';
import { mockBlogPosts, getBlogPostBySlug } from '@/lib/mock/blog';
import { useTranslations } from '@/hooks/useTranslations';
import { ClockIcon, ArrowLeftIcon, ArrowRightIcon, HeartIcon } from '@/components/icons';

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <BlogDetailInner params={params} />;
}

function BlogDetailInner({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = React.useState('');
  const { t } = useTranslations();

  React.useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const post = slug ? getBlogPostBySlug(slug) : undefined;

  if (!slug) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-surface-alt rounded w-48" />
          <div className="h-8 bg-surface-alt rounded w-3/4" />
          <div className="h-64 bg-surface-alt rounded-[16px]" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-surface rounded-full flex items-center justify-center">
          <span className="text-4xl">?</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">Post Not Found</h1>
        <p className="text-text-secondary mb-6">The blog post you are looking for does not exist or has been removed.</p>
        <Link href="/blog">
          <span className="inline-flex items-center justify-center h-[48px] px-6 bg-primary text-text-inverse font-semibold rounded-[12px] hover:bg-primary-dark transition-colors">
            <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Blog
          </span>
        </Link>
      </div>
    );
  }

  const relatedPosts = mockBlogPosts
    .filter((p) => p.id !== post.id && (p.category === post.category || p.tags.some((t) => post.tags.includes(t))))
    .slice(0, 3);

  const paragraphs = post.content.split('\n\n');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-text-secondary flex-wrap">
          <li><Link href="/" className="hover:text-primary-dark transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-border">/</li>
          <li><Link href="/blog" className="hover:text-primary-dark transition-colors">Blog</Link></li>
          <li aria-hidden="true" className="text-border">/</li>
          <li className="text-text-primary font-medium truncate max-w-[200px]">{post.title}</li>
        </ol>
      </nav>

      {/* Article Header */}
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
        <p className="text-lg text-text-secondary leading-relaxed mb-6">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary-dark">
              {post.author.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{post.author}</p>
              <p className="text-xs text-text-secondary">
                Published {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Share article" className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full border border-border hover:bg-surface-alt transition-colors">
              <HeartIcon className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative aspect-[2/1] rounded-[16px] overflow-hidden mb-10 border border-border">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Article Content */}
      <article className="prose prose-lg max-w-none mb-12">
        {paragraphs.map((para, i) => {
          if (para.startsWith('## ')) {
            return <h2 key={i} className="text-2xl font-extrabold text-text-primary mt-8 mb-4">{para.replace('## ', '')}</h2>;
          }
          if (para.startsWith('### ')) {
            return <h3 key={i} className="text-xl font-bold text-text-primary mt-6 mb-3">{para.replace('### ', '')}</h3>;
          }
          if (para.startsWith('**') && para.endsWith('**')) {
            return <p key={i} className="text-text-primary font-semibold mb-3 leading-relaxed">{para.replace(/\*\*/g, '')}</p>;
          }
          if (para.startsWith('**Ingredients:**') || para.startsWith('**Tips:')) {
            return (
              <div key={i} className="bg-surface border border-border rounded-[12px] p-5 my-5">
                <p className="text-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
              </div>
            );
          }
          if (para.startsWith('|')) {
            const rows = para.split('\n').filter((r) => r.trim() && !r.includes('---'));
            const headers = rows[0]?.split('|').filter(Boolean).map((h) => h.trim()) || [];
            const dataRows = rows.slice(1).map((r) => r.split('|').filter(Boolean).map((c) => c.trim()));
            return (
              <div key={i} className="overflow-x-auto my-5">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {headers.map((h, hi) => (
                        <th key={hi} className="text-left py-3 px-4 bg-surface border border-border font-semibold text-text-primary">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row, ri) => (
                      <tr key={ri} className="border border-border">
                        {row.map((cell, ci) => (
                          <td key={ci} className="py-3 px-4 text-text-secondary">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          if (para.startsWith('- ') || para.startsWith('1. ')) {
            const items = para.split('\n').filter((l) => l.trim());
            const isOrdered = para.startsWith('1.');
            const Tag = isOrdered ? 'ol' : 'ul';
            return (
              <Tag key={i} className={`text-text-secondary leading-relaxed mb-4 ${isOrdered ? 'list-decimal' : 'list-disc'} pl-6 space-y-2`}>
                {items.map((item, li) => (
                  <li key={li} className="text-text-primary">{item.replace(/^[-\d.]+\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
                ))}
              </Tag>
            );
          }
          if (para.startsWith('**') && para.includes(':**')) {
            return (
              <div key={i} className="bg-surface border border-border rounded-[12px] p-5 my-5">
                <p className="text-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
              </div>
            );
          }
          if (para.startsWith('*') && para.endsWith('*') && !para.startsWith('**')) {
            return <p key={i} className="text-primary-dark italic font-medium my-4 leading-relaxed">{para.replace(/\*/g, '')}</p>;
          }
          if (para.startsWith('## ')) return null;
          return (
            <p key={i} className="text-text-primary leading-relaxed mb-4 text-lg">
              {para}
            </p>
          );
        })}
      </article>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-10 pb-8 border-b border-border">
        {post.tags.map((tag) => (
          <span key={tag} className="px-4 py-2 bg-surface border border-border rounded-full text-sm font-medium text-text-secondary">
            #{tag}
          </span>
        ))}
      </div>

      {/* Back to Blog */}
      <div className="mb-12">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-dark hover:underline">
          <ArrowLeftIcon className="w-4 h-4" /> Back to all blog posts
        </Link>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section>
          <h2 className="text-2xl font-extrabold text-text-primary mb-6">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((rp) => (
              <Link key={rp.id} href={`/blog/${rp.slug}`} className="block h-full">
                <article className="bg-surface border border-border rounded-[16px] overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-full">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={rp.coverImage}
                      alt={rp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <span className="absolute top-3 left-3 bg-primary/90 text-text-inverse text-xs font-semibold px-3 py-1 rounded-full">
                      {rp.category}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center gap-1 text-xs text-text-secondary">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {rp.readTime} min read
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-text-primary mb-2 group-hover:text-primary-dark transition-colors line-clamp-2">
                      {rp.title}
                    </h3>
                    <p className="text-sm text-text-secondary line-clamp-2 flex-1">{rp.excerpt}</p>
                    <span className="flex items-center gap-1 text-sm font-semibold text-primary-dark mt-3">
                      {t('home.blog.readMore')} <ArrowRightIcon className="w-4 h-4" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
