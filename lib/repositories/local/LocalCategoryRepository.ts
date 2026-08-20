import { Category } from '@/lib/types';
import { CategoryRepository } from '../contracts/CategoryRepository';
import { mockCategories } from '@/lib/mock/products';

const categories: Category[] = [...mockCategories];

export class LocalCategoryRepository implements CategoryRepository {
  findAll(): Category[] {
    return [...categories];
  }

  findById(id: string): Category | null {
    for (const cat of categories) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const child = cat.children.find((c) => c.id === id);
        if (child) return child;
      }
    }
    return null;
  }

  findBySlug(slug: string): Category | null {
    for (const cat of categories) {
      if (cat.slug === slug) return cat;
      if (cat.children) {
        const child = cat.children.find((c) => c.slug === slug);
        if (child) return child;
      }
    }
    return null;
  }

  findChildren(parentId: string): Category[] {
    const parent = categories.find((c) => c.id === parentId);
    return parent?.children ?? [];
  }

  create(data: Omit<Category, 'id'>): Category {
    const category: Category = { ...data, id: crypto.randomUUID() };
    if (category.parentId) {
      const parent = categories.find((c) => c.id === category.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(category);
      }
    } else {
      categories.push(category);
    }
    return category;
  }

  update(id: string, data: Partial<Category>): Category | null {
    for (const cat of categories) {
      if (cat.id === id) {
        Object.assign(cat, data);
        return cat;
      }
      if (cat.children) {
        const child = cat.children.find((c) => c.id === id);
        if (child) {
          Object.assign(child, data);
          return child;
        }
      }
    }
    return null;
  }

  delete(id: string): boolean {
    const index = categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      categories.splice(index, 1);
      return true;
    }
    for (const cat of categories) {
      if (cat.children) {
        const childIndex = cat.children.findIndex((c) => c.id === id);
        if (childIndex !== -1) {
          cat.children.splice(childIndex, 1);
          return true;
        }
      }
    }
    return false;
  }
}
