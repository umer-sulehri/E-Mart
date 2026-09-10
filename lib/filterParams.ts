/**
 * Pure helpers for converting between URL search params and product filter
 * state. Framework-free so the URL <-> filter mapping can be unit tested.
 */

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
  minRating: number;
  brands: string[];
  inStockOnly: boolean;
  featuredOnly: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  categories: [],
  minPrice: '',
  maxPrice: '',
  minRating: 0,
  brands: [],
  inStockOnly: false,
  featuredOnly: false,
};

/**
 * Reads a possibly comma-separated multi-value param, falling back to a
 * legacy single-value key (e.g. `categories` -> `category`).
 */
export function parseCsvParam(
  params: URLSearchParams,
  newKey: string,
  legacyKey: string
): string[] {
  const multi = params.get(newKey);
  if (multi) return multi.split(',').filter(Boolean);
  const single = params.get(legacyKey);
  return single ? [single] : [];
}

/** Builds a committed FilterState from URL search params. */
export function filtersFromSearchParams(
  params: URLSearchParams
): FilterState {
  const rawRating = Number(params.get('minRating') || 0);
  return {
    categories: parseCsvParam(params, 'categories', 'category'),
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    minRating: Number.isNaN(rawRating) ? 0 : rawRating,
    brands: parseCsvParam(params, 'brands', 'brand'),
    inStockOnly: params.get('inStock') === 'true',
    featuredOnly: params.get('featured') === 'true',
  };
}

/** Serializes a committed FilterState into URL search params. */
export function filtersToSearchParams(
  filters: FilterState,
  base?: URLSearchParams
): URLSearchParams {
  const params = base ? new URLSearchParams(base) : new URLSearchParams();
  params.delete('category');
  params.delete('brand');

  if (filters.categories.length > 0) {
    params.set('categories', filters.categories.join(','));
  } else {
    params.delete('categories');
  }

  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  else params.delete('minPrice');

  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  else params.delete('maxPrice');

  if (filters.minRating > 0) params.set('minRating', String(filters.minRating));
  else params.delete('minRating');

  if (filters.brands.length > 0) {
    params.set('brands', filters.brands.join(','));
  } else {
    params.delete('brands');
  }

  if (filters.inStockOnly) params.set('inStock', 'true');
  else params.delete('inStock');

  if (filters.featuredOnly) params.set('featured', 'true');
  else params.delete('featured');

  params.delete('page');
  return params;
}

/** Builds the `api.products.list` query parameters from a committed state. */
export function filtersToApiParams(
  filters: FilterState
): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.categories.length > 0) {
    params.categories = filters.categories.join(',');
  }
  if (filters.minPrice !== '') params.minPrice = filters.minPrice;
  if (filters.maxPrice !== '') params.maxPrice = filters.maxPrice;
  if (filters.minRating > 0) params.minRating = String(filters.minRating);
  if (filters.brands.length > 0) {
    params.brands = filters.brands.join(',');
  }
  if (filters.inStockOnly) params.inStock = 'true';
  if (filters.featuredOnly) params.featured = 'true';
  return params;
}

/** Count of active filter groups (used for the mobile filter badge). */
export function activeFilterCount(filters: FilterState): number {
  let count = 0;
  if (filters.categories.length > 0) count++;
  if (filters.minPrice !== '' || filters.maxPrice !== '') count++;
  if (filters.minRating > 0) count++;
  if (filters.brands.length > 0) count++;
  if (filters.inStockOnly) count++;
  if (filters.featuredOnly) count++;
  return count;
}