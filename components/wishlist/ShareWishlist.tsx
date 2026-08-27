'use client';

import { useState } from 'react';
import { Share2, Link as LinkIcon, Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';

interface ShareWishlistProps {
  wishlistId?: string;
}

export default function ShareWishlist({ wishlistId }: ShareWishlistProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (shareUrl) {
      copyToClipboard(shareUrl);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/wishlist/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlistId }),
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setShareUrl(json.data.url);
        copyToClipboard(json.data.url);
      } else {
        toast.error('Failed to generate share link');
      }
    } catch {
      toast.error('Failed to share wishlist');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('Share link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      loading={loading}
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? 'Copied!' : 'Share Wishlist'}
    </Button>
  );
}
