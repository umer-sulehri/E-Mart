import { SocialLink } from '@/lib/types';

export interface SocialLinkRepository {
  findAll(): Promise<SocialLink[]>;
  findActive(): Promise<SocialLink[]>;
  findById(id: string): Promise<SocialLink | null>;
  create(data: Omit<SocialLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialLink>;
  update(id: string, data: Partial<SocialLink>): Promise<SocialLink | null>;
  delete(id: string): Promise<boolean>;
  updateSortOrder(id: string, sortOrder: number): Promise<SocialLink | null>;
}
