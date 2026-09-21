// Client-side image upload helpers. Vercel's serverless functions reject request
// bodies above ~4.5MB with a 413 (Request Entity Too Large) *before* our route
// handler runs, so large images must be compressed in the browser first and the
// upload response must be parsed defensively (the 413 body is plain text, not JSON).

const VERCEL_BODY_LIMIT = 4.5 * 1024 * 1024;

export interface CompressOptions {
  /** Longest edge in px the image is downscaled to. Default 1600. */
  maxDimension?: number;
  /** Encoder quality 0..1. Default 0.82. */
  quality?: number;
  /** Files at or below this size are uploaded unchanged. Default 3MB. */
  skipCompressionAbove?: number;
}

/**
 * Downscale/compress an image so the upload fits within Vercel's request body
 * limit. GIFs, PDFs (non-image types) and already-small files are returned as-is.
 */
export async function compressImageFile(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const { maxDimension = 1600, quality = 0.85, skipCompressionAbove = 3 * 1024 * 1024 } = opts;

  if (
    file.type !== 'image/jpeg' &&
    file.type !== 'image/png' &&
    file.type !== 'image/webp'
  ) {
    return file;
  }
  if (file.size <= skipCompressionAbove) {
    return file;
  }

  let bitmap: ImageBitmap | HTMLImageElement;
  let width: number;
  let height: number;
  let close: () => void;

  try {
    bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    close = () => (bitmap as ImageBitmap).close();
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Unable to read image'));
        el.src = url;
      });
      bitmap = img;
      width = img.naturalWidth;
      height = img.naturalHeight;
      close = () => URL.revokeObjectURL(url);
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
  }

  try {
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);

    let blob = await canvasToBlob(canvas, quality);
    // Iteratively drop quality/dimension until the payload safely fits.
    for (let q = quality; blob && blob.size > VERCEL_BODY_LIMIT * 0.9 && q > 0.4; q -= 0.15) {
      canvas.width = Math.max(1, Math.round(canvas.width * 0.8));
      canvas.height = Math.max(1, Math.round(canvas.height * 0.8));
      ctx.drawImage(bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
      blob = await canvasToBlob(canvas, q);
    }

    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name, { type: blob.type });
  } finally {
    close();
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', quality);
  });
}

interface UploadResult {
  success: boolean;
  error?: string;
  url?: string;
  path?: string;
}

/**
 * Parse an upload endpoint response even when the server returns a non-JSON
 * body (e.g. Vercel's 413 "Request Entity Too Large" text page).
 */
export async function parseUploadResponse(res: Response): Promise<UploadResult> {
  const text = await res.text();
  let json: { success?: boolean; error?: string; data?: { url?: string; path?: string } } | null = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (res.ok && json?.success && json.data?.url) {
    return { success: true, url: json.data.url, path: json.data.path };
  }
  if (json?.error) {
    return { success: false, error: json.error };
  }
  if (res.status === 413) {
    return {
      success: false,
      error: 'Image is too large. The file was automatically compressed — choose a smaller image or upload a compressed file.',
    };
  }
  return { success: false, error: `Upload failed (${res.status}). Please try again.` };
}

/**
 * Compress (if needed) and upload a file to /api/v1/uploads. Returns the public
 * URL or throws a human-readable Error.
 */
export async function uploadImageFile(
  file: File,
  bucket: string,
  folder = '',
  opts: CompressOptions = {}
): Promise<string> {
  const prepared = await compressImageFile(file, opts);

  const formData = new FormData();
  formData.append('file', prepared);
  formData.append('bucket', bucket);
  if (folder) formData.append('folder', folder);

  const res = await fetch('/api/v1/uploads', { method: 'POST', body: formData });
  const result = await parseUploadResponse(res);
  if (!result.success || !result.url) {
    throw new Error(result.error || 'Upload failed');
  }
  return result.url;
}