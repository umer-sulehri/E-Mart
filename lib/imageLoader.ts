/**
 * Resolve a product/image source into a renderable URL for <Image>.
 *
 * Handles:
 *  - empty -> fallback
 *  - absolute http(s) URLs (incl. protocol-relative "//...")
 *  - blob: / data: URLs (local upload previews)
 *  - Supabase storage relative paths -> public URL
 *  - local absolute paths
 */
export const FALLBACK_IMAGE = "/images/placeholder.webp";

function getSupabaseUrl(): { url: string; ref: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return { url: parsed.origin, ref: parsed.hostname.split(".")[0] };
  } catch {
    return null;
  }
}

export function resolveImage(src?: string | null): string {
  if (!src) return FALLBACK_IMAGE;

  const trimmed = src.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  // blob:/data: URLs (local previews) pass through unchanged
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return trimmed;

  // Absolute / protocol-relative URLs pass through
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//")) {
    return trimmed;
  }

  // Supabase storage relative paths: "object/public/products/xyz.jpg"
  const storageMatch = trimmed.match(
    /^(?:storage\/)?object\/public\/([^/]+)\/(.+)$/
  );
  if (storageMatch) {
    const supabase = getSupabaseUrl();
    if (supabase) {
      return `${supabase.url}/storage/v1/object/public/${storageMatch[1]}/${storageMatch[2]}`;
    }
  }

  // Local absolute path
  if (trimmed.startsWith("/")) return trimmed;

  // Relative path (e.g. "images/foo.jpg") -> normalise to absolute
  return `/${trimmed}`;
}

/** True when the source is a remote URL (needs next/image remotePatterns). */
export function isRemoteImage(src?: string | null): boolean {
  if (!src) return false;
  return (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("//")
  );
}
