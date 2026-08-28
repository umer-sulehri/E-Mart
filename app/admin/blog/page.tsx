'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Newspaper, Eye } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  status: string;
  published_at: string | null;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-muted-50">
      <td className="px-6 py-4"><div className="h-16 w-24 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-48 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted-200" /></td>
    </tr>
  );
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/blog-posts');
      const data = await res.json();
      if (data.success) {
        setPosts(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load posts');
      }
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const confirmDelete = (post: BlogPost) => {
    setDeleteTarget(post);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/blog-posts/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Post deleted');
        fetchPosts();
      } else {
        toast.error(data.error || 'Failed to delete post');
      }
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Blog Posts</h1>
          <p className="text-sm text-muted-500">Manage blog content and articles</p>
        </div>
        <Link href="/admin/blog/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Cover</th>
                <th className="px-6 py-3 font-medium text-muted-600">Title</th>
                <th className="px-6 py-3 font-medium text-muted-600">Status</th>
                <th className="px-6 py-3 font-medium text-muted-600">Published</th>
                <th className="px-6 py-3 font-medium text-muted-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                : posts.length === 0
                  ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <Newspaper className="mx-auto mb-3 h-10 w-10 text-muted-300" />
                          <p className="text-sm text-muted-500">No blog posts found</p>
                        </td>
                      </tr>
                    )
                  : posts.map((post) => (
                      <tr key={post.id} className="border-b border-muted-50 transition-colors hover:bg-muted-50/50">
                        <td className="px-6 py-3">
                          <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-muted-100">
                            <Image
                              src={post.cover_image}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-medium text-secondary-800 line-clamp-1">{post.title}</p>
                          <p className="text-xs text-muted-400">{post.slug}</p>
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant={post.status === 'published' ? 'success' : 'warning'}>
                            {post.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-muted-600">
                          {post.published_at ? formatDate(post.published_at) : 'Not published'}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              className="rounded-lg p-2 text-muted-500 transition-colors hover:bg-muted-100 hover:text-primary"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/admin/blog/${post.id}`}
                              className="rounded-lg p-2 text-muted-500 transition-colors hover:bg-muted-100 hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => confirmDelete(post)}
                              className="rounded-lg p-2 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Post"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
