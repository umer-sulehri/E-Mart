'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import BlogForm from '@/components/admin/BlogForm';

export default function NewBlogPostPage() {
  const router = useRouter();

  const handleSubmit = async (data: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    cover_image: string;
    is_published: boolean;
  }) => {
    const res = await fetch('/api/v1/admin/blog-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      toast.success('Blog post created');
      router.push('/admin/blog');
    } else {
      toast.error(json.error || 'Failed to create post');
      throw new Error(json.error);
    }
  };

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-500">
        <Link href="/" className="inline-flex items-center gap-1 text-muted-500 transition-colors hover:text-primary">
          <Home className="h-3.5 w-3.5" /> Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/admin/blog" className="text-muted-500 transition-colors hover:text-primary">Blog</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-secondary-800">New Post</span>
      </nav>

      <div className="flex items-center gap-4">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-2 rounded-lg border border-muted-200 bg-white px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-muted-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">New Blog Post</h1>
          <p className="text-sm text-muted-500">Create a new article</p>
        </div>
      </div>

      <BlogForm mode="add" onSubmit={handleSubmit} />
    </div>
  );
}
