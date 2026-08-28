import { type Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Clock,
  User,
  Tag,
  Facebook,
  Twitter,
  Share2,
  Link as LinkIcon,
  ThumbsUp,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  categorySlug: string;
  author: { name: string; avatar: string };
  date: string;
  readTime: string;
  tags: string[];
}

const MOCK_POSTS: Record<string, BlogPost> = {
  'benefits-of-eating-organic-food': {
    id: '1',
    title: '10 Benefits of Eating Organic Food Daily',
    slug: 'benefits-of-eating-organic-food',
    excerpt: 'Discover why switching to organic food can transform your health and wellbeing.',
    content: `
      <p class="mb-4 text-secondary-700 leading-relaxed">Organic food has gained immense popularity in recent years, and for good reason. Choosing organic produce and products can have a profound impact on your health, the environment, and even your taste buds.</p>
      <h2 class="font-heading text-xl font-bold text-secondary-800 mt-6 mb-3">1. Rich in Nutrients</h2>
      <p class="mb-4 text-secondary-700 leading-relaxed">Studies have shown that organic fruits and vegetables contain higher levels of vitamin C, antioxidants, and essential minerals compared to their conventionally grown counterparts.</p>
      <h2 class="font-heading text-xl font-bold text-secondary-800 mt-6 mb-3">2. No Harmful Pesticides</h2>
      <p class="mb-4 text-secondary-700 leading-relaxed">Organic farming avoids the use of synthetic pesticides and chemicals, reducing your exposure to potentially harmful substances.</p>
      <h2 class="font-heading text-xl font-bold text-secondary-800 mt-6 mb-3">3. Better Taste</h2>
      <p class="mb-4 text-secondary-700 leading-relaxed">Many people report that organic food simply tastes better. This is because organic farming focuses on soil health, which directly impacts the flavor of the produce.</p>
      <h2 class="font-heading text-xl font-bold text-secondary-800 mt-6 mb-3">4. Environmental Benefits</h2>
      <p class="mb-4 text-secondary-700 leading-relaxed">Organic farming practices promote biodiversity, conserve water, and reduce soil erosion, making it a more sustainable choice for our planet.</p>
      <h2 class="font-heading text-xl font-bold text-secondary-800 mt-6 mb-3">5. Supports Local Farmers</h2>
      <p class="mb-4 text-secondary-700 leading-relaxed">When you buy organic, you often support local farmers and small-scale producers who are committed to sustainable agriculture.</p>
    `,
    coverImage: '/images/post-thumbnail-1.jpg',
    category: 'Organic Living',
    categorySlug: 'organic-living',
    author: { name: 'Sarah Khan', avatar: '/images/reviewer-1.jpg' },
    date: '2026-08-15',
    readTime: '5 min read',
    tags: ['organic', 'health', 'nutrition', 'wellness'],
  },
  'fresh-green-smoothie-recipes': {
    id: '2',
    title: 'Fresh Green Smoothie Recipes for Summer',
    slug: 'fresh-green-smoothie-recipes',
    excerpt: 'Beat the heat with these refreshing green smoothie recipes.',
    content: `<p class="mb-4 text-secondary-700 leading-relaxed">Summer is the perfect time to enjoy refreshing, nutritious smoothies. Here are our top green smoothie recipes using fresh ingredients.</p>`,
    coverImage: '/images/post-thumbnail-2.jpg',
    category: 'Recipes',
    categorySlug: 'recipes',
    author: { name: 'Ahmad Raza', avatar: '/images/reviewer-2.jpg' },
    date: '2026-08-10',
    readTime: '3 min read',
    tags: ['recipes', 'smoothie', 'summer'],
  },
  'emart-expands-delivery': {
    id: '3',
    title: 'E-Mart Expands Delivery to 20+ Cities',
    slug: 'emart-expands-delivery',
    excerpt: 'We are excited to announce that E-Mart now delivers to over 20 cities across Pakistan.',
    content: `<p class="mb-4 text-secondary-700 leading-relaxed">E-Mart is expanding rapidly to serve more customers across Pakistan.</p>`,
    coverImage: '/images/post-thumbnail-3.jpg',
    category: 'News',
    categorySlug: 'news',
    author: { name: 'E-Mart Team', avatar: '/images/reviewer-3.jpg' },
    date: '2026-08-05',
    readTime: '2 min read',
    tags: ['news', 'expansion', 'delivery'],
  },
};

const RELATED_POSTS = [
  { id: '1', title: 'Benefits of Organic Food', slug: 'benefits-of-eating-organic-food', coverImage: '/images/post-thumbnail-1.jpg', date: '2026-08-15' },
  { id: '2', title: 'Green Smoothie Recipes', slug: 'fresh-green-smoothie-recipes', coverImage: '/images/post-thumbnail-2.jpg', date: '2026-08-10' },
  { id: '3', title: 'E-Mart Expands Delivery', slug: 'emart-expands-delivery', coverImage: '/images/post-thumbnail-3.jpg', date: '2026-08-05' },
];

const CATEGORIES_LIST = [
  { name: 'Health Tips', count: 12 },
  { name: 'Recipes', count: 18 },
  { name: 'Organic Living', count: 9 },
  { name: 'News', count: 5 },
];

const POPULAR_POSTS = RELATED_POSTS;

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/v1/blog-posts/${slug}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  let post = await fetchBlogPost(slug);
  if (!post) {
    post = MOCK_POSTS[slug] || null;
  }
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: BlogDetailPageProps) {
  const { slug } = await params;

  let post = await fetchBlogPost(slug);
  if (!post) {
    post = MOCK_POSTS[slug] || null;
  }

  if (!post) {
    notFound();
  }

  return (
    <>
      {/* Breadcrumb */}
      <section className="border-b border-muted-100 bg-white py-4">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Blog', href: '/blog' },
              { label: post.category, href: `/blog?category=${post.categorySlug}` },
              { label: post.title },
            ]}
          />
        </div>
      </section>

      {/* Article */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <article className="lg:col-span-2">
              {/* Cover Image */}
              <div className="relative mb-8 h-[300px] overflow-hidden rounded-2xl sm:h-[400px]">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              </div>

              {/* Title */}
              <h1 className="mb-4 font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
                {post.title}
              </h1>

              {/* Author & Meta */}
              <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-500">
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-800">{post.author.name}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(post.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {post.readTime}
                </span>
              </div>

              {/* Content */}
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <Tag size={16} className="text-muted-500" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted-100 px-3 py-1 text-xs font-medium text-secondary-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Share Buttons */}
              <div className="mt-8 flex items-center gap-3">
                <span className="text-sm font-medium text-secondary-800">Share:</span>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700">
                  <Facebook size={16} />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white transition-colors hover:bg-sky-600">
                  <Twitter size={16} />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white transition-colors hover:bg-green-600">
                  <Share2 size={16} />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-muted-200 text-secondary-700 transition-colors hover:bg-muted-300">
                  <LinkIcon size={16} />
                </button>
              </div>

              {/* Comments Placeholder */}
              <div className="mt-12 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-heading text-xl font-bold text-secondary-800">
                  Comments (0)
                </h2>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageCircle size={32} className="mb-3 text-muted-300" />
                  <p className="text-sm text-muted-500">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
                <div className="mt-4">
                  <textarea
                    placeholder="Write a comment..."
                    className="w-full rounded-lg border border-muted-200 px-4 py-3 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={3}
                  />
                  <div className="mt-3 flex justify-end">
                    <button className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-500">
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Categories */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  Categories
                </h3>
                <ul className="space-y-2">
                  {CATEGORIES_LIST.map((cat) => (
                    <li key={cat.name}>
                      <Link
                        href={`/blog?category=${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-secondary-700 transition-colors hover:bg-muted-50"
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs text-muted-500">{cat.count}</span>
                      </Link>
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
                  {POPULAR_POSTS.map((p) => (
                    <Link
                      key={p.id}
                      href={`/blog/${p.slug}`}
                      className="group flex gap-3"
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={p.coverImage}
                          alt={p.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-secondary-800 line-clamp-2 group-hover:text-primary transition-colors">
                          {p.title}
                        </h4>
                        <p className="mt-1 text-xs text-muted-500">
                          {new Date(p.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <section className="border-t border-muted-100 py-12">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Related Posts" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RELATED_POSTS.map((rp) => (
              <Link
                key={rp.id}
                href={`/blog/${rp.slug}`}
                className="group rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-48 overflow-hidden rounded-t-2xl">
                  <Image
                    src={rp.coverImage}
                    alt={rp.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-bold text-secondary-800 group-hover:text-primary transition-colors">
                    {rp.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted-500">
                    {new Date(rp.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
