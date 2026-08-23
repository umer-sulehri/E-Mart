import { Banner, BannerSlot } from '@/lib/types';
import { BannerRepository } from '../contracts/BannerRepository';

const seed: Banner[] = [
  {
    id: 'local-hero-1',
    slot: 'hero',
    title: 'Fresh Smoothie & Summer Juice',
    subtitle: '100% natural',
    description: 'Freshly pressed juices and smoothies delivered to your door.',
    imageUrl: '/images/product-thumb-1.png',
    ctaLabel: 'Shop Now',
    ctaHref: '/products',
    sortOrder: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class LocalBannerRepository implements BannerRepository {
  private rows: Banner[] = [...seed];

  async findAll(): Promise<Banner[]> {
    return [...this.rows].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findActive(): Promise<Banner[]> {
    return this.findAll().then((rows) => rows.filter((r) => r.isActive));
  }

  async findBySlot(slot: BannerSlot): Promise<Banner[]> {
    return this.findActive().then((rows) => rows.filter((r) => r.slot === slot));
  }

  async findById(id: string): Promise<Banner | null> {
    return this.rows.find((r) => r.id === id) ?? null;
  }

  async create(data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Banner> {
    const now = new Date().toISOString();
    const row: Banner = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    this.rows.push(row);
    return row;
  }

  async update(id: string, data: Partial<Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Banner> {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error('Banner not found');
    this.rows[idx] = { ...this.rows[idx], ...data, updatedAt: new Date().toISOString() };
    return this.rows[idx];
  }

  async delete(id: string): Promise<void> {
    this.rows = this.rows.filter((r) => r.id !== id);
  }
}
