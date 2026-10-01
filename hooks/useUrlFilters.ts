'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { filterHref } from '@/lib/urlFilters';
import { useDebounce } from './useDebounce';

/**
 * Keeps an admin list table's filters in the URL.
 *
 * Two things make this awkward enough to be worth a hook:
 *
 * 1. A search box is controlled state, so it must be written to the URL *after*
 *    the debounce, and then read back *from* the URL when the URL changes for
 *    another reason (Back, a shared link). Without both directions the box and
 *    the table disagree after a refresh.
 * 2. Filter changes and search changes want different history semantics. Picking
 *    a filter is a distinct view worth undoing with Back, so it pushes. Typing
 *    refines the current view, so it replaces — otherwise Back walks through
 *    every pause in a word.
 *
 * Clearing several filters must go through one `setFilters` call. A batch of
 * per-key updates each rebuild the query from the same stale `searchParams`, so
 * all but the last would be silently dropped when the URL settles.
 *
 * Requires a `<Suspense>` boundary, as `useSearchParams` opts the route out of
 * static rendering.
 */
export interface UseUrlFiltersOptions {
  /** Query key holding the debounced search term. */
  searchKey?: string;
  /** Debounce in ms before the term reaches the URL and the fetch. */
  debounceMs?: number;
}

export interface UrlFilters {
  /** Debounced, trimmed term. Safe to use as a fetch dependency. */
  search: string;
  /** Raw controlled value for the search box. */
  searchInput: string;
  setSearchInput: (value: string) => void;
  /** Navigate to a new filter state. Pushed, so Back undoes it. */
  setFilters: (patch: Record<string, string | null>) => void;
  /** Clear the search box and its URL key in the same navigation. */
  clearSearch: (extraPatch?: Record<string, string | null>) => void;
}

export function useUrlFilters({
  searchKey = 'q',
  debounceMs = 400,
}: UseUrlFiltersOptions = {}): UrlFilters {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchInput, setSearchInput] = useState(() => searchParams.get(searchKey) ?? '');
  const search = useDebounce(searchInput, debounceMs).trim();
  // The term this view last wrote, so a URL change we did not cause (Back, a
  // shared link) can be told apart from the user typing.
  const ownSearch = useRef(search);

  const navigate = useCallback(
    (patch: Record<string, string | null>, push: boolean) => {
      const href = filterHref(pathname, searchParams.toString(), patch);
      if (push) router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Push the debounced term into the URL once it settles.
  useEffect(() => {
    if (search === ownSearch.current) return;
    ownSearch.current = search;
    const fromUrl = searchParams.get(searchKey) ?? '';
    if (fromUrl === search) return;
    navigate({ [searchKey]: search || null }, false);
  }, [search, searchKey, searchParams, navigate]);

  // Adopt a term that arrived from Back/forward or a shared link. Skipped while
  // a term this view wrote is still settling, or the box would snap back to the
  // outgoing value under the user's cursor.
  useEffect(() => {
    const fromUrl = searchParams.get(searchKey) ?? '';
    if (fromUrl === searchInput || fromUrl === search) return;
    ownSearch.current = fromUrl;
    setSearchInput(fromUrl);
  }, [searchParams, searchKey, searchInput, search]);

  const setFilters = useCallback(
    (patch: Record<string, string | null>) => navigate(patch, true),
    [navigate]
  );

  const clearSearch = useCallback(
    (extraPatch: Record<string, string | null> = {}) => {
      setSearchInput('');
      // Mark the *pending* term as already synced, not the empty one: the
      // debounced `search` still holds the old value for this tick, and
      // re-syncing it would immediately put the cleared term back in the URL.
      ownSearch.current = search;
      navigate({ [searchKey]: null, ...extraPatch }, true);
    },
    [navigate, searchKey, search]
  );

  return { search, searchInput, setSearchInput, setFilters, clearSearch };
}
