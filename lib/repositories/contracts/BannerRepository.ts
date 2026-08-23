import { Banner, BannerSlot } from '@/lib/types';

export interface BannerRepository {
  findAll(): Promise<Banner[]>;
  findActive(): Promise<Banner[]>;
  findBySlot(slot: BannerSlot): Promise<Banner[]>;
  findById(id: string): Promise<Banner | null>;
  create(data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Banner>;
  update(id: string, data: Partial<Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Banner>;
  delete(id: string): Promise<void>;
}
