import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://emart.pk';

// Some products/blog rows have null or missing timestamp columns. Guard the
// value so sitemap serialization (Date.toISOString) never receives an invalid
// Date, which throws RangeError and 500s the whole sitemap.
function safeLastModified(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Try to fetch products and blog posts for dynamic URLs
  try {
    const [productsRes, blogRes] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || BASE_URL + '/api/v1'}/products?limit=100`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || BASE_URL + '/api/v1'}/blog-posts?limit=50`),
    ]);

    if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
      const products = await productsRes.value.json();
      if (products.data) {
        for (const product of products.data) {
          const lastModified = safeLastModified(product.updated_at || product.created_at);
          staticPages.push({
            url: `${BASE_URL}/products/${product.slug}`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }
    }

    if (blogRes.status === 'fulfilled' && blogRes.value.ok) {
      const posts = await blogRes.value.json();
      if (posts.data) {
        for (const post of posts.data) {
          const lastModified = safeLastModified(post.updated_at || post.published_at || post.created_at);
          staticPages.push({
            url: `${BASE_URL}/blog/${post.slug}`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    // Fallback to static pages only
  }

  return staticPages;
}
