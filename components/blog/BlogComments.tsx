'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  avatar: string;
}

export default function BlogComments({ postId }: { postId: string }) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/blog-posts/${postId}/comments`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setComments(json.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handlePost = async () => {
    const text = comment.trim();
    if (!text) {
      toast.error('Please write a comment');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/blog-posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const json = await res.json();
      if (res.status === 401) {
        toast.error(json.error || 'Please sign in to comment');
        router.push('/login');
        return;
      }
      if (!json.success) {
        toast.error(json.error || 'Failed to post comment');
        return;
      }
      setComments((prev) => [
        {
          id: json.data.id,
          content: json.data.content,
          createdAt: json.data.createdAt,
          author: 'You',
          avatar: '/images/avatar-1.jpg',
        },
        ...prev,
      ]);
      setComment('');
      toast.success('Comment posted');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-heading text-xl font-bold text-secondary-800">
        Comments ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageCircle size={32} className="mb-3 text-muted-300" />
          <p className="text-sm text-muted-500">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 rounded-lg border border-muted-100 p-4">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted-100">
                <ImageWithFallback
                  src={c.avatar}
                  alt={c.author}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-secondary-800">{c.author}</span>
                  <span className="text-xs text-muted-500">
                    {new Date(c.createdAt).toLocaleDateString('en-PK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-secondary-700">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <textarea
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-muted-200 px-4 py-3 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          rows={3}
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={handlePost}
            disabled={submitting}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>
    </div>
  );
}
