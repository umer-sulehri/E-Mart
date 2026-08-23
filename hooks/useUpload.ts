import { useMutation } from '@tanstack/react-query';

export interface UploadResult {
  url: string;
}

/**
 * Uploads an image to /api/v1/uploads (multipart). Returns the hosted URL on
 * success; surfaces the server's message on failure.
 */
export function useImageUpload(onError?: (message: string) => void) {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/v1/uploads', {
        method: 'POST',
        body,
        credentials: 'same-origin',
      });
      const payload = (await res.json().catch(() => null)) as
        | (UploadResult & { error?: string })
        | null;
      if (!res.ok || !payload?.url) {
        throw new Error(payload?.error ?? 'Failed to upload image.');
      }
      return { url: payload.url };
    },
    onError: (err) => onError?.(err instanceof Error ? err.message : 'Failed to upload image.'),
  });
}
