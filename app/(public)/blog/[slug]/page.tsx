'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useTranslations } from '@/hooks/useTranslations';
import { ClockIcon, ArrowLeftIcon, ArrowRightIcon, HeartIcon } from '@/components/icons';

type Block =
  | { type: 'h2' | 'h3' | 'p'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hr' };

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${key++}`} className="font-semibold text-text-primary">{match[1]}</strong>);
    } else {
      nodes.push(<em key={`${keyPrefix}-${key++}`}>{match[2]}</em>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function parseBlocks(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) });
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
        if (!cells.every((c) => /^:?-{3,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      if (rows.length > 0) {
        blocks.push({ type: 'table', headers: rows[0], rows: rows.slice(1) });
      }
      continue;
    }
    const isOrdered = /^\d+\.\s/.test(line);
    const isBullet = /^[-*]\s/.test(line);
    if (isOrdered || isBullet) {
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        if (!l) {
          if (items.length > 0 && i + 1 < lines.length) {
            const next = lines[i + 1]?.trim() ?? '';
            if (isOrdered ? /^\d+\.\s/.test(next) : /^[-*]\s/.test(next)) {
              i++;
              continue;
            }
          }
          break;
        }
        if (isOrdered ? /^\d+\.\s/.test(l) : /^[-*]\s/.test(l)) {
          items.push(l.replace(isOrdered ? /^\d+\.\s*/ : /^[-*]\s*/, ''));
          i++;
        } else if (l.startsWith('#') || l.startsWith('|') || /^-{3,}$/.test(l)) {
          break;
        } else if (items.length > 0) {
          items[items.length - 1] += ` ${l}`;
          i++;
        } else {
          break;
        }
      }
      if (items.length > 0) {
        blocks.push({ type: isOrdered ? 'ol' : 'ul', items });
      }
      continue;
    }
    blocks.push({ type: 'p', text: line });
    i++;
  }
  return blocks;
}

function MarkdownBlocks({ content }: { content: string }) {
  const blocks = parseBlocks(content);
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={i} className="text-2xl md:text-[28px] font-extrabold text-text-primary mt-10 mb-4">
                {parseInline(block.text, `h2-${i}`)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="text-xl font-bold text-text-primary mt-8 mb-3">
                {parseInline(block.text, `h3-${i}`)}
              </h3>
            );
          case 'ul':
            return (
              <ul key={i} className="list-disc pl-6 space-y-2 mb-5 text-text-primary leading-relaxed">
                {block.items.map((item, li) => (
                  <li key={li}>{parseInline(item, `ul-${i}-${li}`)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className="list-decimal pl-6 space-y-2 mb-5 text-text-primary leading-relaxed">
                {block.items.map((item, li) => (
                  <li key={li}>{parseInline(item, `ol-${i}-${li}`)}</li>
                ))}
              </ol>
            );
          case 'table':
            return (
              <div key={i} className="overflow-x-auto my-6 rounded-[12px] border border-border">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {block.headers.map((h, hi) => (
                        <th key={hi} className="text-left py-3 px-4 bg-surface-alt font-semibold text-text-primary border-b border-border">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-border last:border-b-0">
                        {row.map((cell, ci) => (
                          <td key={ci} className="py-3 px-4 text-text-secondary">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'hr':
            return <hr key={i} className="my-8 border-border" />;
          case 'p':
          default:
            return (
              <p key={i} className="text-text-primary leading-relaxed mb-4 text-[17px]">
                {parseInline(block.text, `p-${i}`)}
              </p>
            );
        }
      })}
    </>
  );
}

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useTranslations();
  const { data: allPosts = [] } = useBlogPosts();

  const post = allPosts.find((p) => p.slug === slug);

  if (!post && allPosts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-6 border-4 border-border border-t-primary rounded-full animate-spin" />
        <p className="text-text-secondary">Loading post…</p>
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

  const relatedPosts = allPosts
    .filter((p) => p.id !== post?.id && (p.category === post?.category || p.tags.some((tag) => post?.tags.includes(tag))))
    .slice(0, 3);

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
      <article className="mb-12">
        <MarkdownBlocks content={post.content} />
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
