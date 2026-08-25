'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Tag, ArrowRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import SectionHeader from '@/components/ui/SectionHeader';

interface BlogPost {
  id: number;
  thumbnail: string;
  category: string;
  title: string;
  excerpt: string;
  authorName: string;
  authorAvatar: string;
  date: string;
  slug: string;
}

const fallbackBlogPosts: BlogPost[] = [
  {
    id: 1,
    thumbnail: '/images/post-thumbnail-1.jpg',
    category: 'Food, Health',
    title: 'Benefits of Eating Organic Food for Your Family',
    excerpt:
      'Discover why organic food is becoming the preferred choice for health-conscious families. Learn about the nutritional advantages and how to make the switch easily.',
    authorName: 'Sarah Johnson',
    authorAvatar: '/images/reviewer-1.jpg',
    date: '22 Aug 2024',
    slug: 'benefits-of-eating-organic-food',
  },
  {
    id: 2,
    thumbnail: '/images/post-thumbnail-2.jpg',
    category: 'Tips & Tricks',
    title: '10 Easy Healthy Recipes for Busy Weeknights',
    excerpt:
      'Quick and nutritious recipes that the whole family will love. Perfect for those hectic weekday evenings when time is short but you still want a wholesome meal.',
    authorName: 'Michael Chen',
    authorAvatar: '/images/reviewer-2.jpg',
    date: '25 Aug 2024',
    slug: 'easy-healthy-recipes-weeknights',
  },
  {
    id: 3,
    thumbnail: '/images/post-thumbnail-3.jpg',
    category: 'Lifestyle',
    title: 'How to Build a Sustainable Grocery Shopping Habit',
    excerpt:
      'Practical tips for making eco-friendly choices at the supermarket. From reducing plastic waste to supporting local farmers, small changes can make a big difference.',
    authorName: 'Emma Wilson',
    authorAvatar: '/images/reviewer-3.jpg',
    date: '28 Aug 2024',
    slug: 'sustainable-grocery-shopping',
  },
];

const BlogSection = React.forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>(fallbackBlogPosts);

    useEffect(() => {
      fetch('/api/v1/blog-posts?limit=3')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const mapped = json.data.map((post: any, i: number) => ({
              id: i,
              thumbnail: post.cover_image || `/images/post-thumbnail-${(i % 3) + 1}.jpg`,
              category: post.category || 'General',
              title: post.title,
              excerpt: post.excerpt || '',
              authorName: post.author || 'Admin',
              authorAvatar: `/images/reviewer-${(i % 3) + 1}.jpg`,
              date: post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A',
              slug: post.slug,
            }));
            setBlogPosts(mapped);
          }
        })
        .catch(() => {});
    }, []);

    return (
      <section ref={ref} id="latest-blog" className={cn('pb-4', className)}>
        <SectionHeader
          title="Our Recent Blog"
          viewAllLink="/blog"
          viewAllText="View All"
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="group overflow-hidden rounded-[0.375rem] border-0 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Link href={`/blog/${post.slug}`}>
                  <Image
                    src={post.thumbnail}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </Link>
              </div>

              <div className="card-body p-3">
                <div className="post-meta flex text-uppercase gap-3 my-2 items-center">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    {post.category}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-bold leading-snug text-secondary-800 transition-colors group-hover:text-primary">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h3>

                <p className="mb-4 text-sm leading-relaxed text-muted-600">
                  {post.excerpt}
                </p>

                <Link
                  href={`/blog/${post.slug}`}
                  className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-500"
                >
                  Read More
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <div className="mt-auto flex items-center gap-3 border-t border-muted-100 pt-4">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full">
                    <Image
                      src={post.authorAvatar}
                      alt={post.authorName}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-500">
                    <User className="h-3 w-3" />
                    <span>{post.authorName}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }
);

BlogSection.displayName = 'BlogSection';

export default BlogSection;
