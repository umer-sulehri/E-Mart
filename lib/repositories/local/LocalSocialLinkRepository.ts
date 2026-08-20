import { SocialLink } from '@/lib/types';
import { SocialLinkRepository } from '../contracts/SocialLinkRepository';

const defaultLinks: SocialLink[] = [
  { id: 'sl-1', platform: 'facebook', label: 'Facebook', url: 'https://facebook.com/emart', icon: 'facebook', isActive: true, sortOrder: 0, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'sl-2', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/emart', icon: 'instagram', isActive: true, sortOrder: 1, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'sl-3', platform: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/923001234567', icon: 'whatsapp', isActive: true, sortOrder: 2, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'sl-4', platform: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@emart', icon: 'tiktok', isActive: true, sortOrder: 3, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'sl-5', platform: 'youtube', label: 'YouTube', url: 'https://youtube.com/@emart', icon: 'youtube', isActive: true, sortOrder: 4, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'sl-6', platform: 'x', label: 'X (Twitter)', url: 'https://x.com/emart', icon: 'x', isActive: true, sortOrder: 5, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

const links: SocialLink[] = [...defaultLinks];

export class LocalSocialLinkRepository implements SocialLinkRepository {
  async findAll(): Promise<SocialLink[]> {
    return [...links].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findActive(): Promise<SocialLink[]> {
    return links.filter(l => l.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findById(id: string): Promise<SocialLink | null> {
    return links.find(l => l.id === id) ?? null;
  }

  async create(data: Omit<SocialLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialLink> {
    const now = new Date().toISOString();
    const link: SocialLink = {
      ...data,
      id: `sl-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    links.push(link);
    return link;
  }

  async update(id: string, data: Partial<SocialLink>): Promise<SocialLink | null> {
    const idx = links.findIndex(l => l.id === id);
    if (idx === -1) return null;
    links[idx] = { ...links[idx], ...data, updatedAt: new Date().toISOString() };
    return links[idx];
  }

  async delete(id: string): Promise<boolean> {
    const idx = links.findIndex(l => l.id === id);
    if (idx === -1) return false;
    links.splice(idx, 1);
    return true;
  }

  async updateSortOrder(id: string, sortOrder: number): Promise<SocialLink | null> {
    const idx = links.findIndex(l => l.id === id);
    if (idx === -1) return null;
    links[idx] = { ...links[idx], sortOrder, updatedAt: new Date().toISOString() };
    return links[idx];
  }
}
