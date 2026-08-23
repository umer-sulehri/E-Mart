import { Product } from '@/lib/types';
import { ProductRepository, ProductFilters } from '../contracts/ProductRepository';
import { mockProducts, mockCategories } from '@/lib/mock/products';

const products: Product[] = [...mockProducts];

export class LocalProductRepository implements ProductRepository {
  findAll(filters?: ProductFilters, page?: number, limit?: number): { products: Product[]; total: number } {
    let result = [...products];

    if (filters) {
      if (filters.ids?.length) {
        const idSet = new Set(filters.ids);
        result = result.filter((p) => idSet.has(p.id));
      }
      if (filters.category) {
        // Search the full category tree (top-level + children) for the target
        let targetCategory = mockCategories.find((c) => c.id === filters.category || c.slug === filters.category);
        let isChildCategory = false;

        // If not found at top level, search children
        if (!targetCategory) {
          for (const cat of mockCategories) {
            if (cat.children) {
              const child = cat.children.find((c) => c.id === filters.category || c.slug === filters.category);
              if (child) {
                targetCategory = cat;
                isChildCategory = true;
                break;
              }
            }
          }
        }

        if (isChildCategory) {
          // Filter by the specific child category ID/slug only
          result = result.filter(
            (p) =>
              p.categoryId === filters.category ||
              p.category.slug === filters.category
          );
        } else if (targetCategory) {
          // Parent category: include all children
          const childIds = targetCategory.children?.map((c) => c.id) ?? [];
          result = result.filter(
            (p) =>
              p.categoryId === targetCategory!.id ||
              childIds.includes(p.categoryId)
          );
        } else {
          // Fallback: try direct match
          result = result.filter(
            (p) =>
              p.categoryId === filters.category ||
              p.category.slug === filters.category
          );
        }
      }
      if (filters.minPrice !== undefined) {
        result = result.filter((p) => p.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        result = result.filter((p) => p.price <= filters.maxPrice!);
      }
      if (filters.minRating !== undefined) {
        result = result.filter((p) => p.rating >= filters.minRating!);
      }
      if (filters.inStock) {
        result = result.filter((p) => p.stock > 0);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      if (filters.sort) {
        switch (filters.sort) {
          case 'price_asc':
            result.sort((a, b) => a.price - b.price);
            break;
          case 'price_desc':
            result.sort((a, b) => b.price - a.price);
            break;
          case 'rating':
            result.sort((a, b) => b.rating - a.rating);
            break;
          case 'popularity':
            result.sort((a, b) => (b.reviewCount - a.reviewCount) || (b.rating - a.rating));
            break;
          case 'newest':
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
        }
      }
      if (filters.sellerId) {
        result = result.filter((p) => p.sellerId === filters.sellerId);
      }
    }

    const total = result.length;
    const p = page ?? 1;
    const l = limit ?? 20;
    const start = (p - 1) * l;
    const paged = result.slice(start, start + l);

    return { products: paged, total };
  }

  findBySlug(slug: string): Product | null {
    return products.find((p) => p.slug === slug) ?? null;
  }

  findById(id: string): Product | null {
    return products.find((p) => p.id === id) ?? null;
  }

  create(data: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewCount'>): Product {
    const category = mockCategories.find((c) => c.id === data.categoryId) ?? data.category;
    const product: Product = {
      ...data,
      id: crypto.randomUUID(),
      category,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      sellerId: data.sellerId,
    };
    products.push(product);
    return product;
  }

  createBulk(items: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewCount'>[]): Product[] {
    return items.map((data) => this.create(data));
  }

  update(id: string, data: Partial<Product>): Product | null {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...data };
    return products[index];
  }

  delete(id: string): boolean {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    return true;
  }

  search(query: string): Product[] {
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
}
