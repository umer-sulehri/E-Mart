import { BlogPost } from '@/lib/types';
import { BlogPostRepository } from '../contracts/BlogPostRepository';
import { mockBlogPosts } from '@/lib/mock/blog';

export class LocalBlogPostRepository implements BlogPostRepository {
  private rows: BlogPost[] = mockBlogPosts.map((p) => ({ ...p }));

  async findAll(): Promise<BlogPost[]> {
    return [...this.rows].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }

  async findPublished(): Promise<BlogPost[]> {
    return this.findAll();
  }

  async findBySlug(slug: string): Promise<BlogPost | null> {
    return this.rows.find((r) => r.slug === slug) ?? null;
  }

  async findById(id: string): Promise<BlogPost | null> {
    return this.rows.find((r) => r.id === id) ?? null;
  }

  async create(data: Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt'> & { publishedAt?: string }): Promise<BlogPost> {
    const now = new Date().toISOString();
    const row: BlogPost = { ...data, id: crypto.randomUUID(), publishedAt: data.publishedAt ?? now };
    this.rows.push(row);
    return row;
  }

  async update(id: string, data: Partial<Omit<BlogPost, 'id'>>): Promise<BlogPost> {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error('Blog post not found');
    this.rows[idx] = { ...this.rows[idx], ...data };
    return this.rows[idx];
  }

  async delete(id: string): Promise<void> {
    this.rows = this.rows.filter((r) => r.id !== id);
  }
}
