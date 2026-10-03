'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import Pagination from '@/components/ui/Pagination';
import { PAGE_SIZE } from '@/lib/pagination';
import { usePageParam } from '@/hooks/usePageParam';
import { tryParseJson } from '@/lib/api';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  avatar: string;
}

interface CommentMeta {
  totalPages: number;
  totalItems: number;
}

export default function BlogComments(props: { postId: string }) {
  // `usePageParam` reads `useSearchParams`, which must sit behind Suspense.
  return (
    <Suspense>
      <BlogCommentsContent {...props} />
    </Suspense>
  );
}

function BlogCommentsContent({ postId }: { postId: string }) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [meta, setMeta] = useState<CommentMeta>({ totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { page, setPage } = usePageParam({ resetOn: [postId] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/blog-posts/${postId}/comments?page=${page}&limit=${PAGE_SIZE}`
      );
      const json = await tryParseJson<{
        success: boolean;
        data?: Comment[];
        meta?: CommentMeta;
      }>(res);
      if (json?.success) {
        setComments(json.data || []);
        const pages = json.meta?.totalPages ?? 1;
        setMeta({ totalPages: pages, totalItems: json.meta?.totalItems ?? 0 });
        // A comment can be deleted server-side, or `?page=` can be stale.
        if (page > pages) {
          setPage(pages);
        }
      }
    } catch {
      // leave the list as-is rather than blanking it on a transient failure
    } finally {
      setLoading(false);
    }
  }, [postId, page, setPage]);

  useEffect(() => {
    load();
  }, [load]);

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
      const json = await tryParseJson<{
        success: boolean;
        error?: string;
        data?: { id: string; content: string; createdAt: string };
      }>(res);
      if (res.status === 401) {
        toast.error(json?.error || 'Please sign in to comment');
        router.push('/login');
        return;
      }
      if (!json?.success) {
        toast.error(json?.error || 'Failed to post comment');
        return;
      }

      // Newest comments sort first, so on page 1 the optimistic prepend is
      // where it belongs. On a later page it would be invisible anyway, so
      // refetching the page the user is on keeps the count honest either way.
      if (page === 1) {
        setComments((prev) => [
          {
            id: json.data?.id ?? '',
            content: json.data?.content ?? text,
            createdAt: json.data?.createdAt ?? new Date().toISOString(),
            author: 'You',
            avatar: '/images/avatar-1.jpg',
          },
          ...prev,
        ]);
        setMeta((prev) => ({
          ...prev,
          totalItems: prev.totalItems + 1,
          totalPages: Math.max(
            1,
            Math.ceil((prev.totalItems + 1) / PAGE_SIZE)
          ),
        }));
      } else {
        await load();
      }

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
      {/* Counted from `meta`, not `comments.length`: the list is one page of the
          total, so the heading used to read "Comments (10)" on a post with 43. */}
      <h2 className="mb-4 font-heading text-xl font-bold text-secondary-800">
        Comments ({loading && meta.totalItems === 0 ? '…' : meta.totalItems})
      </h2>

      {loading && comments.length === 0 ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 rounded-lg border border-muted-100 p-4">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-muted-100" />
                <div className="h-3 w-full animate-pulse rounded bg-muted-100" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageCircle size={32} className="mb-3 text-muted-300" aria-hidden="true" />
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
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-secondary-800">{c.author}</span>
                  <span className="text-xs text-muted-500">
                    <time dateTime={c.createdAt}>
                      {new Date(c.createdAt).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </span>
                </div>
                <p className="mt-1 break-words text-sm text-secondary-700">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        currentPage={page}
        totalPages={meta.totalPages}
        totalItems={meta.totalItems}
        itemsPerPage={PAGE_SIZE}
        itemLabel="comments"
        variant="simple"
        onPageChange={setPage}
        scrollToTop={false}
        className="mt-6"
      />

      <div className="mt-6">
        <label htmlFor="blog-comment" className="sr-only">
          Write a comment
        </label>
        <textarea
          id="blog-comment"
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-muted-200 px-4 py-3 text-base sm:text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          rows={3}
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={handlePost}
            disabled={submitting}
            className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>
    </div>
  );
}