'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  Home,
  Search,
  Calendar,
  User,
  ArrowRight,
  Tag,
  Mail,
  Loader2,
} from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  categorySlug: string;
  author: { name: string; avatar: string };
  date: string;
  readTime: string;
  tags: string[];
}

const CATEGORIES = ['All', 'Health Tips', 'Recipes', 'Organic Living', 'News'];

const MOCK_POSTS: BlogPost[] = [
  {
    id: '1',
    title: '10 Benefits of Eating Organic Food Daily',
    slug: 'benefits-of-eating-organic-food',
    excerpt: 'Discover why switching to organic food can transform your health and wellbeing. From better nutrition to reduced chemical intake.',
    coverImage: '/images/post-thumbnail-1.jpg',
    category: 'Organic Living',
    categorySlug: 'organic-living',
    author: { name: 'Sarah Khan', avatar: '/images/reviewer-1.jpg' },
    date: '2026-08-15',
    readTime: '5 min read',
    tags: ['organic', 'health', 'nutrition'],
  },
  {
    id: '2',
    title: 'Fresh Green Smoothie Recipes for Summer',
    slug: 'fresh-green-smoothie-recipes',
    excerpt: 'Beat the heat with these refreshing green smoothie recipes packed with fresh fruits and vegetables from your local market.',
    coverImage: '/images/post-thumbnail-2.jpg',
    category: 'Recipes',
    categorySlug: 'recipes',
    author: { name: 'Ahmad Raza', avatar: '/images/reviewer-2.jpg' },
    date: '2026-08-10',
    readTime: '3 min read',
    tags: ['recipes', 'smoothie', 'summer'],
  },
  {
    id: '3',
    title: 'E-Mart Expands Delivery to 20+ Cities',
    slug: 'emart-expands-delivery',
    excerpt: 'We are excited to announce that E-Mart now delivers to over 20 cities across Pakistan, bringing fresh groceries to more doorsteps.',
    coverImage: '/images/post-thumbnail-3.jpg',
    category: 'News',
    categorySlug: 'news',
    author: { name: 'E-Mart Team', avatar: '/images/reviewer-3.jpg' },
    date: '2026-08-05',
    readTime: '2 min read',
    tags: ['news', 'expansion', 'delivery'],
  },
  {
    id: '4',
    title: 'How to Build a Healthy Grocery List',
    slug: 'build-healthy-grocery-list',
    excerpt: 'Learn how to plan your grocery shopping with a balanced, nutritious list that keeps your family healthy and your budget in check.',
    coverImage: '/images/post-thumbnail-1.jpg',
    category: 'Health Tips',
    categorySlug: 'health-tips',
    author: { name: 'Dr. Fatima Ali', avatar: '/images/reviewer-1.jpg' },
    date: '2026-07-28',
    readTime: '4 min read',
    tags: ['health', 'grocery', 'planning'],
  },
  {
    id: '5',
    title: 'Seasonal Fruits in Pakistan: A Complete Guide',
    slug: 'seasonal-fruits-pakistan-guide',
    excerpt: 'A comprehensive guide to seasonal fruits available in Pakistan throughout the year, helping you pick the freshest produce.',
    coverImage: '/images/post-thumbnail-2.jpg',
    category: 'Health Tips',
    categorySlug: 'health-tips',
    author: { name: 'Sara Khan', avatar: '/images/reviewer-2.jpg' },
    date: '2026-07-20',
    readTime: '6 min read',
    tags: ['fruits', 'seasonal', 'guide'],
  },
  {
    id: '6',
    title: 'The Ultimate Homemade Biryani Recipe',
    slug: 'ultimate-homemade-biryani',
    excerpt: 'Master the art of making authentic Pakistani biryani with our step-by-step recipe using the freshest ingredients from E-Mart.',
    coverImage: '/images/post-thumbnail-3.jpg',
    category: 'Recipes',
    categorySlug: 'recipes',
    author: { name: 'Ahmad Raza', avatar: '/images/reviewer-3.jpg' },
    date: '2026-07-15',
    readTime: '8 min read',
    tags: ['recipe', 'biryani', 'pakistani'],
  },
];

const CATEGORIES_LIST = [
  { name: 'Health Tips', count: 12 },
  { name: 'Recipes', count: 18 },
  { name: 'Organic Living', count: 9 },
  { name: 'News', count: 5 },
];

const POPULAR_POSTS = MOCK_POSTS.slice(0, 3);

const ITEMS_PER_PAGE = 4;

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      setLoading(true);
      try {
        const res = await fetch('/api/v1/blog-posts');
        const json = await res.json();
        if (!cancelled && json.success && json.data?.length) {
          setPosts(json.data);
          setTotalPages(Math.ceil(json.data.length / ITEMS_PER_PAGE));
        } else {
          if (!cancelled) {
            setPosts(MOCK_POSTS);
            setTotalPages(Math.ceil(MOCK_POSTS.length / ITEMS_PER_PAGE));
          }
        }
      } catch {
        if (!cancelled) {
          setPosts(MOCK_POSTS);
          setTotalPages(Math.ceil(MOCK_POSTS.length / ITEMS_PER_PAGE));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPosts();
    return () => { cancelled = true; };
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filteredTotalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-secondary-800 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Our Blog
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Blog</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          {/* Category Tabs */}
          <div className="mb-8 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-muted-100 text-secondary-700 hover:bg-muted-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Posts Grid */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-2xl bg-white shadow-sm">
                      <div className="h-48 rounded-t-2xl bg-muted-100" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 w-20 rounded bg-muted-100" />
                        <div className="h-5 w-3/4 rounded bg-muted-100" />
                        <div className="h-4 w-full rounded bg-muted-100" />
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted-100" />
                          <div className="h-3 w-24 rounded bg-muted-100" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginatedPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 text-6xl">📝</div>
                  <h3 className="font-heading text-xl font-bold text-secondary-800">
                    No posts found
                  </h3>
                  <p className="mt-2 text-sm text-muted-500">
                    Try a different category or search term.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {paginatedPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="relative h-48 overflow-hidden rounded-t-2xl">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                          {post.category}
                        </span>
                      </div>
                      <div className="p-5">
                        <h2 className="font-heading text-lg font-bold text-secondary-800 line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                        <p className="mt-2 text-sm text-muted-500 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative h-8 w-8 overflow-hidden rounded-full">
                              <Image
                                src={post.author.avatar}
                                alt={post.author.name}
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-secondary-800">
                                {post.author.name}
                              </p>
                              <p className="text-xs text-muted-500">
                                {new Date(post.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-primary group-hover:underline">
                            Read More
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {filteredTotalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-muted-200 text-secondary-800 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-muted-300"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: filteredTotalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'border-primary bg-primary text-white'
                            : 'border-muted-200 text-secondary-800 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(filteredTotalPages, p + 1))}
                    disabled={currentPage === filteredTotalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-muted-200 text-secondary-800 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-muted-300"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Search */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  Search
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full rounded-lg border border-muted-200 bg-white py-2.5 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" />
                </div>
              </div>

              {/* Categories */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  Categories
                </h3>
                <ul className="space-y-2">
                  {CATEGORIES_LIST.map((cat) => (
                    <li key={cat.name}>
                      <button
                        onClick={() => { setActiveCategory(cat.name === 'Health Tips' ? 'Health Tips' : cat.name); setCurrentPage(1); }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-secondary-700 transition-colors hover:bg-muted-50"
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs text-muted-500">{cat.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Popular Posts */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-heading text-lg font-bold text-secondary-800">
                  Popular Posts
                </h3>
                <div className="space-y-4">
                  {POPULAR_POSTS.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group flex gap-3"
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-secondary-800 line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h4>
                        <p className="mt-1 text-xs text-muted-500">
                          {new Date(post.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div className="rounded-2xl bg-primary p-5 text-white">
                <h3 className="mb-2 font-heading text-lg font-bold">
                  Newsletter
                </h3>
                <p className="mb-4 text-sm text-white/80">
                  Get the latest articles and tips delivered to your inbox.
                </p>
                <input
                  type="email"
                  placeholder="Your email"
                  className="mb-3 w-full rounded-lg bg-white/20 px-4 py-2.5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                <button className="w-full rounded-lg bg-white py-2.5 text-sm font-bold text-primary transition-colors hover:bg-muted-100">
                  Subscribe
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
