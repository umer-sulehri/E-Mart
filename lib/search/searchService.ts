import { getOptionalSupabase } from '@/lib/supabase/optional';
import { cache } from '@/lib/cache/cacheManager';

export interface SearchSuggestion {
  type: 'product' | 'category';
  label: string;
  slug: string;
}

const SUGGESTION_LIMIT = 8;
const TRENDING_LIMIT = 10;

/**
 * Returns product/category suggestions for autocomplete.
 * Uses Postgres ilike pre-filtering; the FTS index (search_vector) accelerates
 * full queries on the products table for the main search endpoint.
 */
export async function getSuggestions(query: string): Promise<SearchSuggestion[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const supabase = await getOptionalSupabase();
  if (!supabase) return [];

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from('products')
      .select('name, slug')
      .eq('status', 'active')
      .ilike('name', `%${term}%`)
      .limit(SUGGESTION_LIMIT),
    supabase.from('categories').select('name, slug').ilike('name', `%${term}%`).limit(3),
  ]);

  const suggestions: SearchSuggestion[] = [
    ...(categoriesResult.data ?? []).map((c) => ({
      type: 'category' as const,
      label: c.name,
      slug: c.slug,
    })),
    ...(productsResult.data ?? []).map((p) => ({
      type: 'product' as const,
      label: p.name,
      slug: p.slug,
    })),
  ];

  return suggestions.slice(0, SUGGESTION_LIMIT);
}

export async function recordSearch(query: string, userId?: string): Promise<void> {
  const term = query.trim().toLowerCase();
  if (term.length < 2) return;

  const supabase = await getOptionalSupabase();
  if (!supabase) return;

  try {
    await supabase.rpc('record_trending_search', { p_query: term });
    if (userId) {
      await supabase.from('search_history').insert({ user_id: userId, query: term });
    }
  } catch {
    // Search analytics must never break search itself.
  }
}

export async function getTrendingSearches(): Promise<string[]> {
  return cache.wrap('search:trending', async () => {
    const supabase = await getOptionalSupabase();
    if (!supabase) return [];
    const { data } = await supabase
      .from('trending_searches')
      .select('query')
      .order('hit_count', { ascending: false })
      .limit(TRENDING_LIMIT);
    return (data ?? []).map((row) => row.query as string);
  }, 60_000);
}

export async function getSearchHistory(userId: string): Promise<string[]> {
  const supabase = await getOptionalSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('search_history')
    .select('query, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const row of data ?? []) {
    if (!seen.has(row.query)) {
      seen.add(row.query);
      unique.push(row.query);
    }
  }
  return unique.slice(0, 8);
}

export async function clearSearchHistory(userId: string): Promise<void> {
  const supabase = await getOptionalSupabase();
  if (!supabase) return;
  await supabase.from('search_history').delete().eq('user_id', userId);
}
