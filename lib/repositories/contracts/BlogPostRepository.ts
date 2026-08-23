import { BlogPost } from '@/lib/types';

export interface BlogPostRepository {
  findAll(): Promise<BlogPost[]>;
  findPublished(): Promise<BlogPost[]>;
  findBySlug(slug: string): Promise<BlogPost | null>;
  findById(id: string): Promise<BlogPost | null>;
  create(data: Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt'> & { publishedAt?: string }): Promise<BlogPost>;
  update(id: string, data: Partial<Omit<BlogPost, 'id'>> & { isPublished?: boolean }): Promise<BlogPost>;
  delete(id: string): Promise<void>;
}
