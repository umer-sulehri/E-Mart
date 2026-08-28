'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import BlogForm from '@/components/admin/BlogForm';

export default function EditBlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/admin/blog-posts/${postId}`);
        const json = await res.json();
        if (!cancelled) {
          if (json.success) {
            setInitialData({
              title: json.data.title,
              slug: json.data.slug,
              excerpt: json.data.excerpt || '',
              content: json.data.content,
              category: json.data.category || '',
              cover_image: json.data.featured_image || '',
              is_published: json.data.status === 'published',
            });
          } else {
            setNotFound(true);
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleSubmit = async (data: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    cover_image: string;
    is_published: boolean;
  }) => {
    const res = await fetch(`/api/v1/admin/blog-posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      toast.success('Blog post updated');
      router.push('/admin/blog');
    } else {
      toast.error(json.error || 'Failed to update post');
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
        <span className="text-secondary-800">Edit Post</span>
      </nav>

      <div className="flex items-center gap-4">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-2 rounded-lg border border-muted-200 bg-white px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-muted-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Edit Blog Post</h1>
          <p className="text-sm text-muted-500">
            {loading ? 'Loading post...' : notFound ? 'Post not found.' : 'Update the article'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-500">Loading...</div>
      ) : notFound ? (
        <div className="rounded-xl bg-white p-8 text-center text-muted-500 shadow-sm">
          This blog post could not be found.
        </div>
      ) : (
        <BlogForm mode="edit" initialData={initialData} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
